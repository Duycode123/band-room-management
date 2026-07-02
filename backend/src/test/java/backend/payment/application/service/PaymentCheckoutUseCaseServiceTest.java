package backend.payment.application.service;

import backend.entity.Booking;
import backend.entity.BookingStatus;
import backend.entity.Customer;
import backend.entity.PaymentMethod;
import backend.entity.PaymentProvider;
import backend.entity.PaymentTransaction;
import backend.entity.PaymentTransactionStatus;
import backend.entity.User;
import backend.payment.application.model.PaymentSessionResult;
import backend.repository.BookingRepository;
import backend.repository.PaymentTransactionRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class PaymentCheckoutUseCaseServiceTest {

    @Mock
    private BookingRepository bookingRepository;

    @Mock
    private PaymentTransactionRepository paymentTransactionRepository;

    private PaymentCheckoutUseCaseService paymentCheckoutUseCaseService;

    @BeforeEach
    void setUp() {
        paymentCheckoutUseCaseService = new PaymentCheckoutUseCaseService(
                bookingRepository,
                paymentTransactionRepository
        );
    }

    @Test
    void createsOnlinePaymentAndMarksBookingPaid() {
        Booking booking = booking(12, PaymentMethod.CASH);
        when(bookingRepository.findByIdAndCustomer_Account_Email(12, "customer@example.com"))
                .thenReturn(Optional.of(booking));
        when(paymentTransactionRepository.save(any(PaymentTransaction.class))).thenAnswer(invocation -> {
            PaymentTransaction saved = invocation.getArgument(0);
            saved.prePersist();
            return saved;
        });

        PaymentSessionResult result = paymentCheckoutUseCaseService.createPaymentSession(
                12,
                "e_wallet",
                "customer@example.com"
        );

        ArgumentCaptor<PaymentTransaction> transactionCaptor = ArgumentCaptor.forClass(PaymentTransaction.class);
        verify(paymentTransactionRepository).save(transactionCaptor.capture());
        verify(bookingRepository).save(booking);

        PaymentTransaction savedTransaction = transactionCaptor.getValue();
        assertEquals(PaymentProvider.VNPAY, savedTransaction.getProvider());
        assertEquals(PaymentTransactionStatus.SUCCEEDED, savedTransaction.getStatus());
        assertEquals(new BigDecimal("450000"), savedTransaction.getAmount());
        assertEquals(BookingStatus.PAID, booking.getStatus());
        assertEquals(PaymentMethod.ONLINE, booking.getPaymentMethod());
        assertEquals("e_wallet", result.method());
        assertEquals("success", result.status());
        assertEquals(booking.getBookingCode(), result.bookingCode());
    }

    @Test
    void createsCashPaymentAndKeepsBookingPending() {
        Booking booking = booking(25, PaymentMethod.ONLINE);
        when(bookingRepository.findByIdAndCustomer_Account_Email(25, "customer@example.com"))
                .thenReturn(Optional.of(booking));
        when(paymentTransactionRepository.save(any(PaymentTransaction.class))).thenAnswer(invocation -> {
            PaymentTransaction saved = invocation.getArgument(0);
            saved.prePersist();
            return saved;
        });

        PaymentSessionResult result = paymentCheckoutUseCaseService.createPaymentSession(
                25,
                "cash",
                "customer@example.com"
        );

        ArgumentCaptor<PaymentTransaction> transactionCaptor = ArgumentCaptor.forClass(PaymentTransaction.class);
        verify(paymentTransactionRepository).save(transactionCaptor.capture());
        verify(bookingRepository).save(booking);

        PaymentTransaction savedTransaction = transactionCaptor.getValue();
        assertEquals(PaymentProvider.COUNTER, savedTransaction.getProvider());
        assertEquals(PaymentTransactionStatus.PENDING, savedTransaction.getStatus());
        assertEquals(BookingStatus.PENDING_PAYMENT, booking.getStatus());
        assertEquals(PaymentMethod.CASH, booking.getPaymentMethod());
        assertEquals("cash", result.method());
        assertEquals("pending", result.status());
    }

    private Booking booking(int id, PaymentMethod paymentMethod) {
        Customer customer = Customer.builder()
                .id(7)
                .account(User.builder().id(7).email("customer@example.com").build())
                .build();

        return Booking.builder()
                .id(id)
                .customer(customer)
                .status(BookingStatus.PENDING_PAYMENT)
                .paymentMethod(paymentMethod)
                .totalAmount(new BigDecimal("450000"))
                .build();
    }
}
