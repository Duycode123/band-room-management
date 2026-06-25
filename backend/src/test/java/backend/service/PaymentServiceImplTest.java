package backend.service;

import backend.config.SePayProperties;
import backend.dto.request.SePayIpnRequest;
import backend.dto.response.SePayCheckoutResponse;
import backend.entity.Booking;
import backend.entity.BookingStatus;
import backend.entity.Customer;
import backend.entity.PaymentMethod;
import backend.entity.PaymentProvider;
import backend.entity.PaymentTransaction;
import backend.entity.PaymentTransactionStatus;
import backend.entity.Role;
import backend.entity.User;
import backend.exception.ForbiddenException;
import backend.repository.BookingRepository;
import backend.repository.PaymentTransactionRepository;
import backend.service.impl.PaymentServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.Optional;
import java.util.function.Function;
import java.util.stream.Collectors;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class PaymentServiceImplTest {

    @Mock
    private BookingRepository bookingRepository;

    @Mock
    private PaymentTransactionRepository paymentTransactionRepository;

    private PaymentServiceImpl paymentService;

    @BeforeEach
    void setUp() {
        SePayProperties sePayProperties = new SePayProperties();
        sePayProperties.setEnvironment("sandbox");
        sePayProperties.setMerchantId("merchant-demo");
        sePayProperties.setSecretKey("secret-demo");
        sePayProperties.setSuccessUrl("http://localhost:3000/payment/success");
        sePayProperties.setErrorUrl("http://localhost:3000/payment/error");
        sePayProperties.setCancelUrl("http://localhost:3000/payment/cancel");
        sePayProperties.setMethod("BANK_TRANSFER");
        sePayProperties.setTransactionType("PAYMENT");
        sePayProperties.setCurrency("VND");

        paymentService = new PaymentServiceImpl(
                bookingRepository,
                paymentTransactionRepository,
                sePayProperties
        );
        ReflectionTestUtils.setField(paymentService, "paymentExpirationMinutes", 15L);
    }

    @Test
    void createsSignedCheckoutPayloadForPendingOnlineBooking() {
        Booking booking = pendingOnlineBooking();
        booking.setCreatedAt(LocalDateTime.of(2030, 1, 10, 9, 0));

        when(bookingRepository.findById(booking.getId())).thenReturn(Optional.of(booking));
        when(paymentTransactionRepository.findTopByBooking_IdAndProviderAndStatusOrderByCreatedAtDesc(
                eq(booking.getId()),
                eq(PaymentProvider.SEPAY),
                eq(PaymentTransactionStatus.CHO_THANH_TOAN)
        )).thenReturn(Optional.empty());
        when(paymentTransactionRepository.save(any(PaymentTransaction.class))).thenAnswer(invocation -> {
            PaymentTransaction transaction = invocation.getArgument(0);
            transaction.setId(88L);
            transaction.setCreatedAt(booking.getCreatedAt());
            return transaction;
        });

        SePayCheckoutResponse response = paymentService.createSePayCheckout(booking.getId(), "customer@example.com");

        Map<String, String> fields = response.fields().stream()
                .collect(Collectors.toMap(
                        field -> field.name(),
                        field -> field.value(),
                        (left, right) -> right
                ));

        assertEquals(booking.getId(), response.bookingId());
        assertEquals(88L, response.paymentTransactionId());
        assertEquals("POST", response.method());
        assertEquals("https://pay-sandbox.sepay.vn/v1/checkout/init", response.actionUrl());
        assertTrue(response.transactionReference().startsWith("SP" + booking.getId()));
        assertEquals(
                booking.getBookingCode() + "-" + response.transactionReference(),
                response.orderInvoiceNumber()
        );
        assertEquals("merchant-demo", fields.get("merchant"));
        assertEquals("BANK_TRANSFER", fields.get("method"));
        assertEquals("PAYMENT", fields.get("transaction_type"));
        assertEquals("300000.00", fields.get("order_amount"));
        assertEquals(response.transactionReference(), fields.get("order_reference"));
        assertEquals(response.orderInvoiceNumber(), fields.get("order_invoice_number"));
        assertEquals("7", fields.get("customer_id"));
        assertTrue(fields.get("success_url").contains("bookingId=1"));
        assertTrue(fields.get("success_url").contains("transactionReference=" + response.transactionReference()));
        assertNotNull(fields.get("signature"));
        assertEquals(booking.getCreatedAt().plusMinutes(15), response.expiresAt());
    }

    @Test
    void reusesExistingPendingTransactionWhenCheckoutIsRequestedAgain() {
        Booking booking = pendingOnlineBooking();
        PaymentTransaction existingTransaction = PaymentTransaction.builder()
                .id(12L)
                .booking(booking)
                .provider(PaymentProvider.SEPAY)
                .transactionReference("SP1EXISTING")
                .amount(new BigDecimal("300000.00"))
                .status(PaymentTransactionStatus.CHO_THANH_TOAN)
                .createdAt(LocalDateTime.of(2030, 1, 10, 9, 5))
                .build();

        when(bookingRepository.findById(booking.getId())).thenReturn(Optional.of(booking));
        when(paymentTransactionRepository.findTopByBooking_IdAndProviderAndStatusOrderByCreatedAtDesc(
                eq(booking.getId()),
                eq(PaymentProvider.SEPAY),
                eq(PaymentTransactionStatus.CHO_THANH_TOAN)
        )).thenReturn(Optional.of(existingTransaction));

        SePayCheckoutResponse response = paymentService.createSePayCheckout(booking.getId(), "customer@example.com");

        assertEquals(12L, response.paymentTransactionId());
        assertEquals("SP1EXISTING", response.transactionReference());
        verify(paymentTransactionRepository, never()).save(any(PaymentTransaction.class));
    }

    @Test
    void rejectsCheckoutForBookingOwnedByAnotherCustomer() {
        Booking booking = pendingOnlineBooking();
        when(bookingRepository.findById(booking.getId())).thenReturn(Optional.of(booking));

        assertThrows(
                ForbiddenException.class,
                () -> paymentService.createSePayCheckout(booking.getId(), "other@example.com")
        );
    }

    @Test
    void marksBookingAsPaidWhenSePaySendsOrderPaidIpn() {
        Booking booking = pendingOnlineBooking();
        PaymentTransaction transaction = PaymentTransaction.builder()
                .id(9L)
                .booking(booking)
                .provider(PaymentProvider.SEPAY)
                .transactionReference("SP1ABCD123")
                .amount(new BigDecimal("300000.00"))
                .status(PaymentTransactionStatus.CHO_THANH_TOAN)
                .build();

        SePayIpnRequest request = new SePayIpnRequest();
        request.setNotificationType("ORDER_PAID");
        SePayIpnRequest.Order order = new SePayIpnRequest.Order();
        order.setOrderInvoiceNumber(booking.getBookingCode() + "-SP1ABCD123");
        request.setOrder(order);
        SePayIpnRequest.Transaction transactionData = new SePayIpnRequest.Transaction();
        transactionData.setTransactionId("7735946670");
        transactionData.setTransactionDate("2026-06-25 15:00:00");
        request.setTransaction(transactionData);

        when(paymentTransactionRepository.findByProviderTransactionId("7735946670")).thenReturn(Optional.empty());
        when(paymentTransactionRepository.findByTransactionReference("SP1ABCD123")).thenReturn(Optional.of(transaction));

        String result = paymentService.handleSePayIpn(request);

        assertEquals("Payment confirmed", result);
        assertEquals(PaymentTransactionStatus.THANH_CONG, transaction.getStatus());
        assertEquals("7735946670", transaction.getProviderTransactionId());
        assertEquals(LocalDateTime.of(2026, 6, 25, 15, 0), transaction.getPaidAt());
        assertEquals(BookingStatus.DA_THANH_TOAN, booking.getStatus());
        verify(paymentTransactionRepository).save(transaction);
        verify(bookingRepository).save(booking);
    }

    @Test
    void marksPendingTransactionVoidedWithoutCancellingBooking() {
        Booking booking = pendingOnlineBooking();
        PaymentTransaction transaction = PaymentTransaction.builder()
                .id(10L)
                .booking(booking)
                .provider(PaymentProvider.SEPAY)
                .transactionReference("SP1VOID123")
                .amount(new BigDecimal("300000.00"))
                .status(PaymentTransactionStatus.CHO_THANH_TOAN)
                .build();

        SePayIpnRequest request = new SePayIpnRequest();
        request.setNotificationType("TRANSACTION_VOID");
        SePayIpnRequest.Order order = new SePayIpnRequest.Order();
        order.setOrderInvoiceNumber(booking.getBookingCode() + "-SP1VOID123");
        request.setOrder(order);

        when(paymentTransactionRepository.findByTransactionReference("SP1VOID123")).thenReturn(Optional.of(transaction));

        String result = paymentService.handleSePayIpn(request);

        assertEquals("Payment voided", result);
        assertEquals(PaymentTransactionStatus.DA_HUY, transaction.getStatus());
        assertEquals(BookingStatus.CHO_THANH_TOAN, booking.getStatus());
        verify(paymentTransactionRepository).save(transaction);
        verify(bookingRepository, never()).save(booking);
    }

    private Booking pendingOnlineBooking() {
        User account = User.builder()
                .id(7)
                .email("customer@example.com")
                .password("unused")
                .role(Role.CUSTOMER)
                .build();

        Customer customer = Customer.builder()
                .id(7)
                .account(account)
                .email("customer@example.com")
                .fullName("Customer")
                .build();

        return Booking.builder()
                .id(1)
                .customer(customer)
                .paymentMethod(PaymentMethod.ONLINE)
                .totalAmount(new BigDecimal("300000"))
                .status(BookingStatus.CHO_THANH_TOAN)
                .build();
    }
}
