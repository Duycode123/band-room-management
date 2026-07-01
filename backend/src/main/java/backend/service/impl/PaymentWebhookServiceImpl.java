package backend.service.impl;

import backend.config.VNPayProperties;
import backend.dto.response.VNPayIpnResponse;
import backend.entity.Booking;
import backend.entity.BookingStatus;
import backend.entity.PaymentTransaction;
import backend.entity.PaymentTransactionStatus;
import backend.repository.PaymentTransactionRepository;
import backend.service.CouponUsageTrackingService;
import backend.service.PaymentWebhookService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.Map;
import java.util.TreeMap;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
public class PaymentWebhookServiceImpl implements PaymentWebhookService {

    private static final String SUCCESS_CODE = "00";
    private static final String ORDER_NOT_FOUND_CODE = "01";
    private static final String ORDER_ALREADY_CONFIRMED_CODE = "02";
    private static final String INVALID_AMOUNT_CODE = "04";
    private static final String INVALID_SIGNATURE_CODE = "97";
    private static final String UNKNOWN_ERROR_CODE = "99";
    private static final Pattern BOOKING_CODE_PATTERN = Pattern.compile("BR\\d{8}");
    private static final DateTimeFormatter VNPAY_DATE_TIME_FORMATTER =
            DateTimeFormatter.ofPattern("yyyyMMddHHmmss");

    private final PaymentTransactionRepository paymentTransactionRepository;
    private final VNPayProperties vnPayProperties;
    private final CouponUsageTrackingService couponUsageTrackingService;

    @Override
    @Transactional
    public VNPayIpnResponse handleVNPayIpn(Map<String, String> params) {
        try {
            if (!isValidSignature(params)) {
                return response(INVALID_SIGNATURE_CODE, "Invalid signature");
            }

            String transactionReference = params.get("vnp_TxnRef");
            PaymentTransaction transaction = paymentTransactionRepository
                    .findByTransactionReference(transactionReference)
                    .orElse(null);

            if (transaction == null) {
                return response(ORDER_NOT_FOUND_CODE, "Order not found");
            }

            if (!isValidAmount(params.get("vnp_Amount"), transaction.getAmount())) {
                return response(INVALID_AMOUNT_CODE, "Invalid amount");
            }

            if (transaction.getStatus() == PaymentTransactionStatus.SUCCEEDED
                    || transaction.getStatus() == PaymentTransactionStatus.FAILED
                    || transaction.getStatus() == PaymentTransactionStatus.CANCELLED) {
                return response(ORDER_ALREADY_CONFIRMED_CODE, "Order already confirmed");
            }

            boolean paymentSuccess = SUCCESS_CODE.equals(params.get("vnp_ResponseCode"))
                    && SUCCESS_CODE.equals(params.get("vnp_TransactionStatus"));

            transaction.setProviderTransactionId(blankToNull(params.get("vnp_TransactionNo")));
            transaction.setResponseCode(params.get("vnp_ResponseCode"));
            transaction.setStatus(paymentSuccess
                    ? PaymentTransactionStatus.SUCCEEDED
                    : PaymentTransactionStatus.FAILED);
            transaction.setPaidAt(paymentSuccess ? parsePayDate(params.get("vnp_PayDate")) : null);

            Booking booking = transaction.getBooking();
            if (booking.getStatus() == BookingStatus.PENDING_PAYMENT) {
                booking.setStatus(paymentSuccess ? BookingStatus.PAID : BookingStatus.CANCELLED);
            }

            if (paymentSuccess) {
                couponUsageTrackingService.recordPaidBookingUsage(booking);
            }

            paymentTransactionRepository.save(transaction);

            return response(SUCCESS_CODE, "Confirm success");
        } catch (Exception exception) {
            return response(UNKNOWN_ERROR_CODE, "Unknown error");
        }
    }

    @Override
    @Transactional
    public Map<String, Object> handleSepayWebhook(Map<String, Object> payload) {
        String transactionReference = extractSepayReference(payload);
        if (isBlank(transactionReference)) {
            return Map.of("success", false, "message", "Missing transaction reference");
        }

        PaymentTransaction transaction = paymentTransactionRepository
                .findByTransactionReference(transactionReference)
                .orElse(null);

        if (transaction == null) {
            return Map.of("success", false, "message", "Transaction not found");
        }

        if (!isSepayAmountValid(payload, transaction.getAmount())) {
            return Map.of("success", false, "message", "Invalid amount");
        }

        if (transaction.getStatus() == PaymentTransactionStatus.SUCCEEDED) {
            return Map.of("success", true, "message", "Transaction already confirmed");
        }

        transaction.setProviderTransactionId(firstText(payload, "id", "transactionId", "referenceCode"));
        transaction.setResponseCode("SEPAY_SUCCESS");
        transaction.setStatus(PaymentTransactionStatus.SUCCEEDED);
        transaction.setPaidAt(LocalDateTime.now());

        Booking booking = transaction.getBooking();
        if (booking.getStatus() == BookingStatus.PENDING_PAYMENT) {
            booking.setStatus(BookingStatus.PAID);
        }

        couponUsageTrackingService.recordPaidBookingUsage(booking);
        paymentTransactionRepository.save(transaction);

        return Map.of("success", true, "message", "Confirm success");
    }

    private boolean isValidSignature(Map<String, String> params) {
        String receivedHash = params.get("vnp_SecureHash");
        String hashSecret = vnPayProperties.getHashSecret();

        if (isBlank(receivedHash) || isBlank(hashSecret)) {
            return false;
        }

        return receivedHash.equalsIgnoreCase(hmacSha512(hashSecret, buildHashData(params)));
    }

    private String buildHashData(Map<String, String> params) {
        Map<String, String> sortedParams = new TreeMap<>(params);
        sortedParams.remove("vnp_SecureHash");
        sortedParams.remove("vnp_SecureHashType");

        StringBuilder hashData = new StringBuilder();

        sortedParams.forEach((key, value) -> {
            if (!isBlank(value)) {
                if (!hashData.isEmpty()) {
                    hashData.append('&');
                }

                hashData.append(key)
                        .append('=')
                        .append(URLEncoder.encode(value, StandardCharsets.US_ASCII));
            }
        });

        return hashData.toString();
    }

    private String hmacSha512(String key, String data) {
        try {
            Mac hmac512 = Mac.getInstance("HmacSHA512");
            SecretKeySpec secretKey = new SecretKeySpec(
                    key.getBytes(StandardCharsets.UTF_8),
                    "HmacSHA512"
            );
            hmac512.init(secretKey);

            byte[] bytes = hmac512.doFinal(data.getBytes(StandardCharsets.UTF_8));
            StringBuilder hash = new StringBuilder(bytes.length * 2);

            for (byte value : bytes) {
                hash.append(String.format("%02x", value));
            }

            return hash.toString();
        } catch (Exception exception) {
            throw new IllegalStateException("Cannot create VNPay secure hash", exception);
        }
    }

    private boolean isValidAmount(String rawAmount, BigDecimal transactionAmount) {
        if (isBlank(rawAmount) || transactionAmount == null) {
            return false;
        }

        try {
            BigDecimal expectedAmount = transactionAmount
                    .multiply(BigDecimal.valueOf(100))
                    .setScale(0, RoundingMode.UNNECESSARY);

            return expectedAmount.compareTo(new BigDecimal(rawAmount)) == 0;
        } catch (ArithmeticException | NumberFormatException exception) {
            return false;
        }
    }

    private LocalDateTime parsePayDate(String rawPayDate) {
        if (isBlank(rawPayDate)) {
            return LocalDateTime.now();
        }

        try {
            return LocalDateTime.parse(rawPayDate, VNPAY_DATE_TIME_FORMATTER);
        } catch (DateTimeParseException exception) {
            return LocalDateTime.now();
        }
    }

    private VNPayIpnResponse response(String code, String message) {
        return new VNPayIpnResponse(code, message);
    }

    private String extractSepayReference(Map<String, Object> payload) {
        String explicitReference = firstText(
                payload,
                "transactionReference",
                "bookingCode",
                "orderCode",
                "order_id",
                "code"
        );

        if (!isBlank(explicitReference)) {
            return explicitReference.trim();
        }

        String content = firstText(payload, "content", "description", "transferContent", "transactionContent");
        if (isBlank(content)) {
            return null;
        }

        Matcher matcher = BOOKING_CODE_PATTERN.matcher(content.toUpperCase());
        return matcher.find() ? matcher.group() : null;
    }

    private boolean isSepayAmountValid(Map<String, Object> payload, BigDecimal transactionAmount) {
        BigDecimal receivedAmount = firstAmount(payload, "amount", "transferAmount", "money", "value");
        if (receivedAmount == null) {
            return true;
        }

        return receivedAmount.compareTo(transactionAmount) == 0;
    }

    private BigDecimal firstAmount(Map<String, Object> payload, String... keys) {
        for (String key : keys) {
            Object value = payload.get(key);
            if (value == null) {
                continue;
            }

            try {
                return new BigDecimal(String.valueOf(value).trim()).setScale(2, RoundingMode.HALF_UP);
            } catch (NumberFormatException exception) {
                return null;
            }
        }

        return null;
    }

    private String firstText(Map<String, Object> payload, String... keys) {
        for (String key : keys) {
            Object value = payload.get(key);
            if (value != null && !String.valueOf(value).isBlank()) {
                return String.valueOf(value);
            }
        }

        return null;
    }

    private String blankToNull(String value) {
        return isBlank(value) ? null : value;
    }

    private boolean isBlank(String value) {
        return value == null || value.isBlank();
    }
}
