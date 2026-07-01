package backend.payment.application.service;

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
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class PaymentCheckoutUseCaseService {

    private final BookingRepository bookingRepository;
    private final PaymentTransactionRepository paymentTransactionRepository;

    @Transactional
    public PaymentSessionResult createPaymentSession(Integer bookingId, String rawMethod, String customerEmail) {
        if (bookingId == null) {
            throw new IllegalArgumentException("bookingId khong duoc de trong");
        }

        CheckoutMethod checkoutMethod = normalizeMethod(rawMethod);
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

        LocalDateTime now = LocalDateTime.now();
        String paymentId = generatePaymentId();
        PaymentMethod selectedPaymentMethod = checkoutMethod == CheckoutMethod.CASH
                ? PaymentMethod.CASH
                : PaymentMethod.ONLINE;
        PaymentTransactionStatus transactionStatus = checkoutMethod == CheckoutMethod.CASH
                ? PaymentTransactionStatus.PENDING
                : PaymentTransactionStatus.SUCCEEDED;

        PaymentTransaction paymentTransaction = PaymentTransaction.builder()
                .booking(booking)
                .provider(checkoutMethod == CheckoutMethod.CASH ? PaymentProvider.COUNTER : PaymentProvider.VNPAY)
                .transactionReference(paymentId)
                .providerTransactionId(checkoutMethod == CheckoutMethod.CASH ? null : "SIM-" + paymentId)
                .amount(resolveAmount(booking))
                .status(transactionStatus)
                .responseCode(checkoutMethod == CheckoutMethod.CASH ? null : "00")
                .paidAt(transactionStatus == PaymentTransactionStatus.SUCCEEDED ? now : null)
                .build();

        paymentTransactionRepository.save(paymentTransaction);

        boolean bookingChanged = booking.getPaymentMethod() != selectedPaymentMethod;
        if (bookingChanged) {
            booking.setPaymentMethod(selectedPaymentMethod);
        }

        if (transactionStatus == PaymentTransactionStatus.SUCCEEDED) {
            booking.setStatus(BookingStatus.PAID);
            bookingChanged = true;
        }

        if (bookingChanged) {
            bookingRepository.save(booking);
        }

        return new PaymentSessionResult(
                paymentId,
                booking.getId(),
                booking.getBookingCode(),
                checkoutMethod.apiValue,
                mapStatus(transactionStatus),
                paymentTransaction.getAmount(),
                buildPaymentReturnUrl(paymentId, booking, checkoutMethod),
                paymentTransaction.getCreatedAt(),
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
                mapStatus(paymentTransaction.getStatus()),
                paymentTransaction.getAmount(),
                paymentTransaction.getCreatedAt(),
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

    private String generatePaymentId() {
        return "PAY-" + UUID.randomUUID().toString().replace("-", "").substring(0, 16).toUpperCase();
    }

    private String buildPaymentReturnUrl(String paymentId, Booking booking, CheckoutMethod method) {
        return "/payment/return"
                + "?paymentId=" + encode(paymentId)
                + "&bookingId=" + encode(booking.getBookingCode())
                + "&backendBookingId=" + booking.getId()
                + "&method=" + encode(method.apiValue);
    }

    private String encode(String value) {
        return URLEncoder.encode(value, StandardCharsets.UTF_8);
    }

    private String mapStatus(PaymentTransactionStatus status) {
        return switch (status) {
            case SUCCEEDED -> "success";
            case PENDING, INITIALIZED -> "pending";
            case FAILED -> "failed";
            case CANCELLED -> "cancelled";
        };
    }

    private String mapMethod(PaymentProvider provider) {
        return provider == PaymentProvider.COUNTER ? "cash" : "online";
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
}
