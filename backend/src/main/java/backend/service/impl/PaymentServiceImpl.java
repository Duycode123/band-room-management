package backend.service.impl;

import backend.config.SePayProperties;
import backend.dto.request.SePayIpnRequest;
import backend.dto.response.SePayCheckoutFieldResponse;
import backend.dto.response.SePayCheckoutResponse;
import backend.entity.Booking;
import backend.entity.BookingStatus;
import backend.entity.PaymentMethod;
import backend.entity.PaymentProvider;
import backend.entity.PaymentTransaction;
import backend.entity.PaymentTransactionStatus;
import backend.exception.ForbiddenException;
import backend.exception.ResourceNotFoundException;
import backend.repository.BookingRepository;
import backend.repository.PaymentTransactionRepository;
import backend.service.PaymentService;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.util.UriComponentsBuilder;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.nio.charset.StandardCharsets;
import java.security.GeneralSecurityException;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.Base64;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class PaymentServiceImpl implements PaymentService {

    private static final Logger log = LoggerFactory.getLogger(PaymentServiceImpl.class);

    private static final DateTimeFormatter SEPAY_TRANSACTION_TIME =
            DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    private final BookingRepository bookingRepository;
    private final PaymentTransactionRepository paymentTransactionRepository;
    private final SePayProperties sePayProperties;

    @Value("${app.booking.payment-expiration-minutes:15}")
    private long paymentExpirationMinutes;

    @Override
    @Transactional
    public SePayCheckoutResponse createSePayCheckout(Integer bookingId, String customerEmail) {
        validateCheckoutConfig();

        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new ResourceNotFoundException("Khong tim thay don dat phong"));

        validateCheckoutEligibility(booking, customerEmail);

        PaymentTransaction paymentTransaction = paymentTransactionRepository
                .findTopByBooking_IdAndProviderAndStatusOrderByCreatedAtDesc(
                        bookingId,
                        PaymentProvider.SEPAY,
                        PaymentTransactionStatus.CHO_THANH_TOAN
                )
                .orElseGet(() -> createPendingTransaction(booking));

        LinkedHashMap<String, String> fields = buildCheckoutFields(booking, paymentTransaction);
        fields.put("signature", generateSignature(fields));

        return new SePayCheckoutResponse(
                booking.getId(),
                paymentTransaction.getId(),
                paymentTransaction.getTransactionReference(),
                buildOrderInvoiceNumber(booking, paymentTransaction),
                sePayProperties.resolveCheckoutUrl(),
                "POST",
                resolveExpiresAt(booking, paymentTransaction),
                toFieldResponses(fields)
        );
    }

    @Override
    @Transactional
    public String handleSePayIpn(SePayIpnRequest request) {
        if (request == null || request.getOrder() == null) {
            log.warn("Ignoring empty SePay IPN payload");
            return "Ignored empty payload";
        }

        String orderInvoiceNumber = request.getOrder().getOrderInvoiceNumber();
        String transactionReference = extractTransactionReference(orderInvoiceNumber);

        if (!StringUtils.hasText(transactionReference)) {
            log.warn("Ignoring SePay IPN without recognizable order_invoice_number: {}", orderInvoiceNumber);
            return "Ignored unknown invoice";
        }

        String providerTransactionId = request.getTransaction() == null
                ? null
                : request.getTransaction().getTransactionId();

        PaymentTransaction paymentTransaction = findPaymentTransaction(transactionReference, providerTransactionId);
        if (paymentTransaction == null) {
            log.warn("Ignoring SePay IPN because transaction was not found: {}", orderInvoiceNumber);
            return "Ignored unknown transaction";
        }

        if (StringUtils.hasText(providerTransactionId)
                && !StringUtils.hasText(paymentTransaction.getProviderTransactionId())) {
            paymentTransaction.setProviderTransactionId(providerTransactionId);
        }

        paymentTransaction.setResponseCode(truncate(request.getNotificationType(), 20));

        String notificationType = request.getNotificationType();
        if ("ORDER_PAID".equalsIgnoreCase(notificationType)) {
            markPaymentSuccessful(paymentTransaction, request);
            return "Payment confirmed";
        }

        if ("TRANSACTION_VOID".equalsIgnoreCase(notificationType)) {
            markPaymentVoided(paymentTransaction);
            return "Payment voided";
        }

        log.info("Received unsupported SePay notification type: {}", notificationType);
        paymentTransactionRepository.save(paymentTransaction);
        return "Notification recorded";
    }

    private void validateCheckoutConfig() {
        requireProperty(sePayProperties.getMerchantId(), "payment.sepay.merchant-id");
        requireProperty(sePayProperties.getSecretKey(), "payment.sepay.secret-key");
        requireProperty(sePayProperties.getSuccessUrl(), "payment.sepay.success-url");
        requireProperty(sePayProperties.getErrorUrl(), "payment.sepay.error-url");
        requireProperty(sePayProperties.getCancelUrl(), "payment.sepay.cancel-url");
        sePayProperties.resolveCheckoutUrl();
    }

    private void validateCheckoutEligibility(Booking booking, String customerEmail) {
        String ownerEmail = booking.getCustomer() != null && booking.getCustomer().getAccount() != null
                ? booking.getCustomer().getAccount().getEmail()
                : null;

        if (!StringUtils.hasText(ownerEmail) || !ownerEmail.equalsIgnoreCase(customerEmail)) {
            throw new ForbiddenException("Ban khong co quyen thanh toan cho don dat phong nay");
        }

        if (booking.getPaymentMethod() != PaymentMethod.ONLINE) {
            throw new IllegalStateException("Don dat phong nay khong su dung thanh toan online");
        }

        if (booking.getStatus() != BookingStatus.CHO_THANH_TOAN) {
            throw new IllegalStateException("Chi co the tao thanh toan cho booking dang cho thanh toan");
        }
    }

    private PaymentTransaction createPendingTransaction(Booking booking) {
        PaymentTransaction paymentTransaction = PaymentTransaction.builder()
                .booking(booking)
                .provider(PaymentProvider.SEPAY)
                .transactionReference(generateTransactionReference(booking.getId()))
                .amount(normalizeAmount(booking.getTotalAmount()))
                .status(PaymentTransactionStatus.CHO_THANH_TOAN)
                .build();

        return paymentTransactionRepository.save(paymentTransaction);
    }

    private LinkedHashMap<String, String> buildCheckoutFields(
            Booking booking,
            PaymentTransaction paymentTransaction
    ) {
        LinkedHashMap<String, String> fields = new LinkedHashMap<>();

        fields.put("merchant", sePayProperties.getMerchantId().trim());
        fields.put("operation", defaultValue(sePayProperties.getOperation(), "PURCHASE"));
        fields.put("method", defaultValue(sePayProperties.getMethod(), "BANK_TRANSFER"));
        fields.put("transaction_type", defaultValue(sePayProperties.getTransactionType(), "PAYMENT"));
        fields.put("order_amount", normalizeAmount(booking.getTotalAmount()).toPlainString());
        fields.put("currency", defaultValue(sePayProperties.getCurrency(), "VND"));
        fields.put("order_reference", paymentTransaction.getTransactionReference());
        fields.put("order_description", buildOrderDescription(booking));
        fields.put("order_invoice_number", buildOrderInvoiceNumber(booking, paymentTransaction));
        putIfHasText(fields, "customer_id", booking.getCustomer() == null ? null : String.valueOf(booking.getCustomer().getId()));
        putIfHasText(fields, "success_url", buildReturnUrl(sePayProperties.getSuccessUrl(), booking, paymentTransaction));
        putIfHasText(fields, "error_url", buildReturnUrl(sePayProperties.getErrorUrl(), booking, paymentTransaction));
        putIfHasText(fields, "cancel_url", buildReturnUrl(sePayProperties.getCancelUrl(), booking, paymentTransaction));

        return fields;
    }

    private List<SePayCheckoutFieldResponse> toFieldResponses(LinkedHashMap<String, String> fields) {
        List<SePayCheckoutFieldResponse> responses = new ArrayList<>();
        for (Map.Entry<String, String> entry : fields.entrySet()) {
            responses.add(new SePayCheckoutFieldResponse(entry.getKey(), entry.getValue()));
        }
        return List.copyOf(responses);
    }

    private String generateSignature(LinkedHashMap<String, String> fields) {
        String dataToSign = fields.entrySet().stream()
                .filter(entry -> !"signature".equals(entry.getKey()))
                .filter(entry -> StringUtils.hasText(entry.getValue()))
                .map(entry -> entry.getKey() + "=" + entry.getValue())
                .reduce((left, right) -> left + "," + right)
                .orElseThrow(() -> new IllegalStateException("Khong co du lieu de tao chu ky SePay"));

        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(
                    sePayProperties.getSecretKey().trim().getBytes(StandardCharsets.UTF_8),
                    "HmacSHA256"
            ));
            return Base64.getEncoder().encodeToString(
                    mac.doFinal(dataToSign.getBytes(StandardCharsets.UTF_8))
            );
        } catch (GeneralSecurityException exception) {
            throw new IllegalStateException("Khong the tao chu ky SePay", exception);
        }
    }

    private String buildOrderDescription(Booking booking) {
        return "Thanh toan dat phong " + booking.getBookingCode();
    }

    private String buildOrderInvoiceNumber(Booking booking, PaymentTransaction paymentTransaction) {
        return booking.getBookingCode() + "-" + paymentTransaction.getTransactionReference();
    }

    private String buildReturnUrl(String baseUrl, Booking booking, PaymentTransaction paymentTransaction) {
        return UriComponentsBuilder.fromUriString(baseUrl)
                .queryParam("bookingId", booking.getId())
                .queryParam("transactionReference", paymentTransaction.getTransactionReference())
                .build(true)
                .toUriString();
    }

    private LocalDateTime resolveExpiresAt(Booking booking, PaymentTransaction paymentTransaction) {
        LocalDateTime baseTime = booking.getCreatedAt() != null
                ? booking.getCreatedAt()
                : paymentTransaction.getCreatedAt();

        if (baseTime == null) {
            baseTime = LocalDateTime.now();
        }

        return baseTime.plusMinutes(paymentExpirationMinutes);
    }

    private PaymentTransaction findPaymentTransaction(String transactionReference, String providerTransactionId) {
        if (StringUtils.hasText(providerTransactionId)) {
            PaymentTransaction byProviderId = paymentTransactionRepository.findByProviderTransactionId(providerTransactionId)
                    .orElse(null);
            if (byProviderId != null) {
                return byProviderId;
            }
        }

        return paymentTransactionRepository.findByTransactionReference(transactionReference)
                .orElse(null);
    }

    private void markPaymentSuccessful(PaymentTransaction paymentTransaction, SePayIpnRequest request) {
        if (paymentTransaction.getStatus() != PaymentTransactionStatus.THANH_CONG) {
            paymentTransaction.setStatus(PaymentTransactionStatus.THANH_CONG);
            paymentTransaction.setPaidAt(parsePaidAt(request));
        }

        Booking booking = paymentTransaction.getBooking();
        if (booking != null && booking.getStatus() == BookingStatus.CHO_THANH_TOAN) {
            booking.setStatus(BookingStatus.DA_THANH_TOAN);
            bookingRepository.save(booking);
        } else if (booking != null && booking.getStatus() == BookingStatus.DA_HUY) {
            log.warn("SePay reported a successful payment for expired booking {}", booking.getId());
        }

        paymentTransactionRepository.save(paymentTransaction);
    }

    private void markPaymentVoided(PaymentTransaction paymentTransaction) {
        if (paymentTransaction.getStatus() == PaymentTransactionStatus.THANH_CONG) {
            log.warn("Ignoring TRANSACTION_VOID for already successful payment {}", paymentTransaction.getId());
            return;
        }

        paymentTransaction.setStatus(PaymentTransactionStatus.DA_HUY);
        paymentTransactionRepository.save(paymentTransaction);
    }

    private LocalDateTime parsePaidAt(SePayIpnRequest request) {
        if (request.getTransaction() == null
                || !StringUtils.hasText(request.getTransaction().getTransactionDate())) {
            return LocalDateTime.now();
        }

        try {
            return LocalDateTime.parse(request.getTransaction().getTransactionDate(), SEPAY_TRANSACTION_TIME);
        } catch (DateTimeParseException exception) {
            log.warn("Could not parse SePay transaction_date: {}", request.getTransaction().getTransactionDate());
            return LocalDateTime.now();
        }
    }

    private String extractTransactionReference(String orderInvoiceNumber) {
        if (!StringUtils.hasText(orderInvoiceNumber)) {
            return null;
        }

        int separatorIndex = orderInvoiceNumber.lastIndexOf('-');
        if (separatorIndex < 0 || separatorIndex == orderInvoiceNumber.length() - 1) {
            return null;
        }

        return orderInvoiceNumber.substring(separatorIndex + 1);
    }

    private BigDecimal normalizeAmount(BigDecimal amount) {
        if (amount == null) {
            throw new IllegalStateException("Tong tien booking khong hop le");
        }

        return amount.setScale(2, RoundingMode.HALF_UP);
    }

    private String defaultValue(String value, String fallback) {
        return StringUtils.hasText(value) ? value.trim() : fallback;
    }

    private void putIfHasText(LinkedHashMap<String, String> fields, String key, String value) {
        if (StringUtils.hasText(value)) {
            fields.put(key, value.trim());
        }
    }

    private void requireProperty(String value, String propertyName) {
        if (!StringUtils.hasText(value)) {
            throw new IllegalStateException(propertyName + " chua duoc cau hinh");
        }
    }

    private String generateTransactionReference(Integer bookingId) {
        String suffix = UUID.randomUUID()
                .toString()
                .replace("-", "")
                .substring(0, 8)
                .toUpperCase();
        return "SP" + bookingId + suffix;
    }

    private String truncate(String value, int maxLength) {
        if (value == null || value.length() <= maxLength) {
            return value;
        }
        return value.substring(0, maxLength);
    }
}
