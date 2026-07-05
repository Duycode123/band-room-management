package backend.payment.application.service;

import backend.config.SePayProperties;
import backend.entity.Booking;
import backend.entity.BookingStatus;
import backend.entity.PaymentMethod;
import backend.entity.PaymentProvider;
import backend.entity.PaymentTransaction;
import backend.entity.PaymentTransactionStatus;
import backend.exception.ResourceNotFoundException;
import backend.payment.application.model.PaymentSessionResult;
import backend.payment.application.model.PaymentTransactionDetail;
import backend.repository.BookingRepository;
import backend.repository.PaymentTransactionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.net.URI;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.TreeMap;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class PaymentCheckoutUseCaseService {

    private final BookingRepository bookingRepository;
    private final PaymentTransactionRepository paymentTransactionRepository;
    private final SePayProperties sePayProperties;

    @Value("${app.booking.payment-expiration-minutes:15}")
    private long paymentExpirationMinutes;

    private static final BigDecimal DEPOSIT_AMOUNT = new BigDecimal("50000");

    @Transactional
    public PaymentSessionResult createPaymentSession(
            Integer bookingId,
            String rawMethod,
            String rawPaymentOption,
            String customerEmail
    ) {
        if (bookingId == null) {
            throw new IllegalArgumentException("bookingId khong duoc de trong");
        }

        CheckoutMethod checkoutMethod = normalizeMethod(rawMethod);
        PaymentOption paymentOption = normalizePaymentOption(rawPaymentOption);
        Booking booking = bookingRepository.findByIdAndCustomer_Account_Email(bookingId, customerEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Khong tim thay don dat phong"));

        if (booking.getStatus() == BookingStatus.CANCELLED) {
            throw new IllegalStateException("Khong the thanh toan don dat phong da bi huy");
        }

        if (booking.getStatus() == BookingStatus.PAID
                || booking.getStatus() == BookingStatus.CHECKED_IN
                || booking.getStatus() == BookingStatus.COMPLETED) {
            throw new IllegalStateException("Don dat phong nay da duoc thanh toan");
        }

        validateMethodForPaymentOption(checkoutMethod, paymentOption);

        String paymentId = generatePaymentId();
        PaymentMethod selectedPaymentMethod = checkoutMethod == CheckoutMethod.CASH
                ? PaymentMethod.CASH
                : PaymentMethod.ONLINE;
        PaymentTransactionStatus transactionStatus = PaymentTransactionStatus.PENDING;
        BigDecimal paymentAmount = resolvePaymentAmount(booking, paymentOption);

        PaymentTransaction paymentTransaction = PaymentTransaction.builder()
                .booking(booking)
                .provider(checkoutMethod == CheckoutMethod.CASH ? PaymentProvider.COUNTER : PaymentProvider.SEPAY)
                .transactionReference(paymentId)
                .providerTransactionId(null)
                .amount(paymentAmount)
                .status(transactionStatus)
                .responseCode("PENDING")
                .paidAt(null)
                .build();

        paymentTransactionRepository.save(paymentTransaction);

        boolean bookingChanged = booking.getPaymentMethod() != selectedPaymentMethod;
        if (bookingChanged) {
            booking.setPaymentMethod(selectedPaymentMethod);
        }

        if (bookingChanged) {
            bookingRepository.save(booking);
        }

        return new PaymentSessionResult(
                paymentId,
                booking.getId(),
                booking.getBookingCode(),
                checkoutMethod.apiValue,
                paymentOption.apiValue,
                mapStatus(paymentTransaction.getStatus(), booking),
                paymentTransaction.getAmount(),
                buildPaymentUrl(paymentId, booking, checkoutMethod, paymentOption, paymentTransaction.getAmount()),
                paymentTransaction.getCreatedAt(),
                resolveExpiresAt(paymentTransaction.getCreatedAt()),
                paymentTransaction.getPaidAt()
        );
    }

    public PaymentTransactionDetail getPaymentTransactionDetail(String paymentId, String customerEmail) {
        if (paymentId == null || paymentId.trim().isBlank()) {
            throw new IllegalArgumentException("paymentId khong duoc de trong");
        }

        PaymentTransaction paymentTransaction = paymentTransactionRepository
                .findByTransactionReferenceAndBooking_Customer_Account_Email(paymentId.trim(), customerEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Khong tim thay giao dich thanh toan"));

        return new PaymentTransactionDetail(
                paymentTransaction.getTransactionReference(),
                paymentTransaction.getBooking().getId(),
                paymentTransaction.getBooking().getBookingCode(),
                mapMethod(paymentTransaction.getProvider()),
                resolvePaymentOption(paymentTransaction).apiValue,
                mapStatus(paymentTransaction.getStatus(), paymentTransaction.getBooking()),
                paymentTransaction.getAmount(),
                paymentTransaction.getCreatedAt(),
                resolveExpiresAt(paymentTransaction.getCreatedAt()),
                paymentTransaction.getPaidAt()
        );
    }

    private CheckoutMethod normalizeMethod(String rawMethod) {
        if (rawMethod == null || rawMethod.trim().isBlank()) {
            throw new IllegalArgumentException("Phuong thuc thanh toan khong duoc de trong");
        }

        String normalized = rawMethod.trim().toLowerCase();
        for (CheckoutMethod value : CheckoutMethod.values()) {
            if (value.apiValue.equals(normalized)) {
                return value;
            }
        }

        throw new IllegalArgumentException("Phuong thuc thanh toan khong hop le");
    }

    private BigDecimal resolveAmount(Booking booking) {
        return booking.getTotalAmount() == null ? BigDecimal.ZERO : booking.getTotalAmount();
    }

    private BigDecimal resolvePaymentAmount(Booking booking, PaymentOption paymentOption) {
        if (paymentOption == PaymentOption.DEPOSIT) {
            return resolveAmount(booking).min(DEPOSIT_AMOUNT);
        }

        return resolveAmount(booking);
    }

    private PaymentOption normalizePaymentOption(String rawPaymentOption) {
        if (rawPaymentOption == null || rawPaymentOption.trim().isBlank()) {
            return PaymentOption.FULL;
        }

        String normalized = rawPaymentOption.trim().toLowerCase();
        for (PaymentOption value : PaymentOption.values()) {
            if (value.apiValue.equals(normalized)) {
                return value;
            }
        }

        throw new IllegalArgumentException("Lua chon thanh toan khong hop le");
    }

    private void validateMethodForPaymentOption(CheckoutMethod checkoutMethod, PaymentOption paymentOption) {
        if (paymentOption == PaymentOption.DEPOSIT && checkoutMethod == CheckoutMethod.CASH) {
            throw new IllegalArgumentException("Dat coc chi ho tro thanh toan online");
        }

        if (paymentOption == PaymentOption.FULL && checkoutMethod != CheckoutMethod.CASH) {
            throw new IllegalArgumentException("Thanh toan toan bo tam thoi chi ho tro tai quay");
        }
    }

    private String generatePaymentId() {
        return "PAY" + UUID.randomUUID().toString().replace("-", "").substring(0, 16).toUpperCase();
    }

    private String buildPaymentUrl(
            String paymentId,
            Booking booking,
            CheckoutMethod method,
            PaymentOption paymentOption,
            BigDecimal amount
    ) {
        if (method != CheckoutMethod.CASH) {
            return buildSePayPortalUrl(paymentId, booking, paymentOption, amount);
        }

        return "/payment/return"
                + "?paymentId=" + encode(paymentId)
                + "&bookingId=" + encode(booking.getBookingCode())
                + "&backendBookingId=" + booking.getId()
                + "&method=" + encode(method.apiValue)
                + "&paymentOption=" + encode(paymentOption.apiValue)
                + "&amount=" + encode(amount.stripTrailingZeros().toPlainString())
                + "&status=pending";
    }

    private String buildSePayPortalUrl(
            String paymentId,
            Booking booking,
            PaymentOption paymentOption,
            BigDecimal amount
    ) {
        String checkoutUrl = blankToNull(sePayProperties.getCheckoutUrl());
        if (checkoutUrl == null) {
            throw new IllegalStateException("Chua cau hinh cong thanh toan SePay");
        }

        Map<String, String> params = buildSePayPortalParams(paymentId, booking, paymentOption, amount);
        if (checkoutUrl.contains("{")) {
            String expandedUrl = checkoutUrl;
            for (Map.Entry<String, String> entry : params.entrySet()) {
                expandedUrl = expandedUrl.replace("{" + entry.getKey() + "}", encode(entry.getValue()));
            }
            return expandedUrl;
        }

        StringBuilder url = new StringBuilder(checkoutUrl);
        url.append(checkoutUrl.contains("?") ? '&' : '?');

        boolean first = true;
        for (Map.Entry<String, String> entry : params.entrySet()) {
            if (!first) {
                url.append('&');
            }

            url.append(entry.getKey()).append('=').append(encode(entry.getValue()));
            first = false;
        }

        String signature = createSePayPortalSignature(params);
        String signatureParam = blankToNull(sePayProperties.getPortalSignatureParam());
        if (signature != null && signatureParam != null) {
            url.append('&').append(signatureParam).append('=').append(encode(signature));
        }

        return url.toString();
    }

    private Map<String, String> buildSePayPortalParams(
            String paymentId,
            Booking booking,
            PaymentOption paymentOption,
            BigDecimal amount
    ) {
        Map<String, String> params = new TreeMap<>();
        putIfPresent(params, "merchantId", sePayProperties.getMerchantId());
        putIfPresent(params, "operation", sePayProperties.getOperation());
        putIfPresent(params, "method", sePayProperties.getMethod());
        putIfPresent(params, "transactionType", sePayProperties.getTransactionType());
        putIfPresent(params, "currency", resolveCurrency());
        putIfPresent(params, "successUrl", resolveReturnUrl(sePayProperties.getSuccessUrl(), paymentId, booking, paymentOption, amount, "pending"));
        putIfPresent(params, "errorUrl", resolveReturnUrl(sePayProperties.getErrorUrl(), paymentId, booking, paymentOption, amount, "failed"));
        putIfPresent(params, "cancelUrl", resolveReturnUrl(sePayProperties.getCancelUrl(), paymentId, booking, paymentOption, amount, "cancelled"));
        params.put("paymentId", paymentId);
        params.put("orderCode", booking.getBookingCode());
        params.put("bookingId", String.valueOf(booking.getId()));
        params.put("amount", toVndInteger(amount));
        params.put("description", paymentId);
        params.put("paymentOption", paymentOption.apiValue);
        return params;
    }

    private String resolveCurrency() {
        String currency = blankToNull(sePayProperties.getCurrency());
        return currency == null ? "VND" : currency;
    }

    private String resolveReturnUrl(
            String configuredUrl,
            String paymentId,
            Booking booking,
            PaymentOption paymentOption,
            BigDecimal amount,
            String status
    ) {
        String normalized = blankToNull(configuredUrl);
        if (normalized == null) {
            return null;
        }

        String returnUrl = normalized
                .replace("{paymentId}", encode(paymentId))
                .replace("{bookingCode}", encode(booking.getBookingCode()))
                .replace("{bookingId}", encode(String.valueOf(booking.getId())))
                .replace("{amount}", encode(amount.stripTrailingZeros().toPlainString()))
                .replace("{paymentOption}", encode(paymentOption.apiValue))
                .replace("{status}", encode(status));

        if (returnUrl.contains("{")) {
            return returnUrl;
        }

        URI uri = URI.create(returnUrl);
        if (uri.getQuery() != null) {
            return returnUrl;
        }

        return returnUrl
                + "?paymentId=" + encode(paymentId)
                + "&bookingId=" + encode(booking.getBookingCode())
                + "&backendBookingId=" + encode(String.valueOf(booking.getId()))
                + "&method=bank_transfer"
                + "&paymentOption=" + encode(paymentOption.apiValue)
                + "&amount=" + encode(amount.stripTrailingZeros().toPlainString())
                + "&status=" + encode(status);
    }

    private void putIfPresent(Map<String, String> params, String key, String value) {
        String normalized = blankToNull(value);
        if (normalized != null) {
            params.put(key, normalized);
        }
    }

    private String createSePayPortalSignature(Map<String, String> params) {
        String secretKey = blankToNull(sePayProperties.getSecretKey());
        if (secretKey == null) {
            return null;
        }

        StringBuilder data = new StringBuilder();
        for (Map.Entry<String, String> entry : params.entrySet()) {
            if (!data.isEmpty()) {
                data.append('&');
            }
            data.append(entry.getKey()).append('=').append(entry.getValue());
        }

        try {
            Mac hmac256 = Mac.getInstance("HmacSHA256");
            hmac256.init(new SecretKeySpec(secretKey.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
            byte[] bytes = hmac256.doFinal(data.toString().getBytes(StandardCharsets.UTF_8));
            StringBuilder hash = new StringBuilder(bytes.length * 2);
            for (byte value : bytes) {
                hash.append(String.format("%02x", value));
            }
            return hash.toString();
        } catch (Exception exception) {
            throw new IllegalStateException("Cannot create SePay portal signature", exception);
        }
    }

    private String toVndInteger(BigDecimal amount) {
        return amount.setScale(0, RoundingMode.HALF_UP).toPlainString();
    }

    private LocalDateTime resolveExpiresAt(LocalDateTime createdAt) {
        if (createdAt == null || paymentExpirationMinutes <= 0) {
            return null;
        }

        return createdAt.plusMinutes(paymentExpirationMinutes);
    }

    private String encode(String value) {
        return URLEncoder.encode(value, StandardCharsets.UTF_8);
    }

    private String mapStatus(PaymentTransactionStatus status, Booking booking) {
        if ((status == PaymentTransactionStatus.PENDING || status == PaymentTransactionStatus.INITIALIZED)
                && booking != null
                && booking.getStatus() == BookingStatus.CANCELLED) {
            return "cancelled";
        }

        return switch (status) {
            case SUCCEEDED -> "success";
            case PENDING, INITIALIZED -> "pending";
            case FAILED -> "failed";
            case CANCELLED -> "cancelled";
        };
    }

    private String mapMethod(PaymentProvider provider) {
        return provider == PaymentProvider.COUNTER ? "cash" : "bank_transfer";
    }

    private PaymentOption resolvePaymentOption(PaymentTransaction transaction) {
        BigDecimal bookingAmount = resolveAmount(transaction.getBooking());
        if (transaction.getAmount() != null && transaction.getAmount().compareTo(bookingAmount) < 0) {
            return PaymentOption.DEPOSIT;
        }

        return PaymentOption.FULL;
    }

    private String blankToNull(String value) {
        return value == null || value.trim().isBlank() ? null : value.trim();
    }

    private enum CheckoutMethod {
        BANK_TRANSFER("bank_transfer"),
        E_WALLET("e_wallet"),
        CASH("cash");

        private final String apiValue;

        CheckoutMethod(String apiValue) {
            this.apiValue = apiValue;
        }
    }

    private enum PaymentOption {
        DEPOSIT("deposit"),
        FULL("full");

        private final String apiValue;

        PaymentOption(String apiValue) {
            this.apiValue = apiValue;
        }
    }
}
