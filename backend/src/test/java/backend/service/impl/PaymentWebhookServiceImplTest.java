package backend.service.impl;

import backend.config.SePayProperties;
import backend.config.VNPayProperties;
import backend.entity.Booking;
import backend.entity.BookingStatus;
import backend.entity.PaymentProvider;
import backend.entity.PaymentTransaction;
import backend.entity.PaymentTransactionStatus;
import backend.repository.PaymentTransactionRepository;
import backend.service.CouponUsageTrackingService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class PaymentWebhookServiceImplTest {

    @Mock
    private PaymentTransactionRepository paymentTransactionRepository;

    @Mock
    private CouponUsageTrackingService couponUsageTrackingService;

    private final VNPayProperties vnPayProperties = new VNPayProperties();
    private final SePayProperties sePayProperties = new SePayProperties();
    private final ObjectMapper objectMapper = new ObjectMapper();

    private PaymentWebhookServiceImpl service;

    @BeforeEach
    void setUp() {
        service = new PaymentWebhookServiceImpl(
                paymentTransactionRepository,
                vnPayProperties,
                sePayProperties,
                couponUsageTrackingService,
                objectMapper
        );
    }

    @Test
    void sepayWebhookRejectsRequestWithoutSecretWhenSecretConfigured() {
        sePayProperties.setIpnSecret("super-secret");

        Map<String, Object> result = service.handleSepayWebhook(
                "{\"code\":\"PAY1\",\"transferType\":\"in\",\"transferAmount\":100000}",
                null,
                null,
                null
        );

        assertEquals(false, result.get("success"));
        verify(paymentTransactionRepository, never()).findByTransactionReference(any());
        verify(paymentTransactionRepository, never()).save(any());
    }

    @Test
    void sepayWebhookRejectsRequestWithWrongSecret() {
        sePayProperties.setIpnSecret("super-secret");

        Map<String, Object> result = service.handleSepayWebhook(
                "{\"code\":\"PAY1\",\"transferType\":\"in\",\"transferAmount\":100000}",
                "Apikey wrong-secret",
                null,
                null
        );

        assertEquals(false, result.get("success"));
        verify(paymentTransactionRepository, never()).save(any());
    }

    @Test
    void sepayWebhookConfirmsBookingWithMatchingApikeySecret() {
        sePayProperties.setIpnSecret("super-secret");
        PaymentTransaction transaction = pendingTransaction("PAY1", new BigDecimal("100000.00"));
        when(paymentTransactionRepository.findByProviderTransactionId("92704"))
                .thenReturn(Optional.empty());
        when(paymentTransactionRepository.findByTransactionReference("PAY1"))
                .thenReturn(Optional.of(transaction));

        Map<String, Object> result = service.handleSepayWebhook(
                """
                        {"id":92704,"code":"PAY1","transferType":"in","transferAmount":100000}
                        """,
                "Apikey super-secret",
                null,
                null
        );

        assertEquals(true, result.get("success"));
        assertEquals(PaymentTransactionStatus.SUCCEEDED, transaction.getStatus());
        assertEquals(BookingStatus.PAID, transaction.getBooking().getStatus());
        assertEquals("92704", transaction.getProviderTransactionId());
        verify(couponUsageTrackingService).recordPaidBookingUsage(transaction.getBooking());
        verify(paymentTransactionRepository).save(transaction);
    }

    @Test
    void sepayWebhookStaysOpenWhenNoSecretConfigured() {
        // ipnSecret left blank: local/dev behaviour, webhook is accepted without a header.
        PaymentTransaction transaction = pendingTransaction("PAY1", new BigDecimal("100000.00"));
        when(paymentTransactionRepository.findByProviderTransactionId("92704"))
                .thenReturn(Optional.empty());
        when(paymentTransactionRepository.findByTransactionReference("PAY1"))
                .thenReturn(Optional.of(transaction));

        Map<String, Object> result = service.handleSepayWebhook(
                """
                        {"id":92704,"code":"PAY1","transferType":"in","transferAmount":100000}
                        """,
                null,
                null,
                null
        );

        assertEquals(true, result.get("success"));
        assertEquals(BookingStatus.PAID, transaction.getBooking().getStatus());
    }

    @Test
    void sepayWebhookAcceptsValidHmacSignature() {
        sePayProperties.setWebhookHmacSecret("hmac-secret");
        PaymentTransaction transaction = pendingTransaction("PAY1", new BigDecimal("100000.00"));
        String body = "{\"id\":92704,\"code\":\"PAY1\",\"transferType\":\"in\",\"transferAmount\":100000}";
        String timestamp = String.valueOf(java.time.Instant.now().getEpochSecond());
        String signature = "sha256=" + hmacSha256("hmac-secret", timestamp + "." + body);

        when(paymentTransactionRepository.findByProviderTransactionId("92704"))
                .thenReturn(Optional.empty());
        when(paymentTransactionRepository.findByTransactionReference("PAY1"))
                .thenReturn(Optional.of(transaction));

        Map<String, Object> result = service.handleSepayWebhook(
                body,
                null,
                signature,
                timestamp
        );

        assertEquals(true, result.get("success"));
        assertEquals(PaymentTransactionStatus.SUCCEEDED, transaction.getStatus());
    }

    @Test
    void sepayWebhookAcknowledgesUnderpaidTransferWithoutConfirmingBooking() {
        PaymentTransaction transaction = pendingTransaction("PAY1", new BigDecimal("100000.00"));
        when(paymentTransactionRepository.findByProviderTransactionId("92704"))
                .thenReturn(Optional.empty());
        when(paymentTransactionRepository.findByTransactionReference("PAY1"))
                .thenReturn(Optional.of(transaction));

        Map<String, Object> result = service.handleSepayWebhook(
                """
                        {"id":92704,"code":"PAY1","transferType":"in","transferAmount":90000}
                        """,
                null,
                null,
                null
        );

        assertEquals(true, result.get("success"));
        assertEquals(PaymentTransactionStatus.PENDING, transaction.getStatus());
        assertEquals(BookingStatus.PENDING_PAYMENT, transaction.getBooking().getStatus());
        verify(paymentTransactionRepository, never()).save(any());
    }

    private PaymentTransaction pendingTransaction(String reference, BigDecimal amount) {
        Booking booking = Booking.builder()
                .id(12)
                .status(BookingStatus.PENDING_PAYMENT)
                .build();

        return PaymentTransaction.builder()
                .booking(booking)
                .provider(PaymentProvider.SEPAY)
                .transactionReference(reference)
                .amount(amount)
                .status(PaymentTransactionStatus.PENDING)
                .build();
    }

    private String hmacSha256(String key, String data) {
        try {
            Mac hmac256 = Mac.getInstance("HmacSHA256");
            SecretKeySpec secretKey = new SecretKeySpec(
                    key.getBytes(StandardCharsets.UTF_8),
                    "HmacSHA256"
            );
            hmac256.init(secretKey);

            byte[] bytes = hmac256.doFinal(data.getBytes(StandardCharsets.UTF_8));
            StringBuilder hash = new StringBuilder(bytes.length * 2);
            for (byte value : bytes) {
                hash.append(String.format("%02x", value));
            }

            return hash.toString();
        } catch (Exception exception) {
            throw new IllegalStateException(exception);
        }
    }
}
