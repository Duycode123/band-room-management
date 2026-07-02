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
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class PaymentCheckoutUseCaseService {

    private final BookingRepository bookingRepository;
    private final PaymentTransactionRepository paymentTransactionRepository;

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
                .providerTransactionId(checkoutMethod == CheckoutMethod.CASH ? null : "SIM-" + paymentId)
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
                "success",
                paymentTransaction.getAmount(),
                buildPaymentReturnUrl(paymentId, booking, checkoutMethod, paymentOption, paymentTransaction.getAmount()),
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
        return "PAY-" + UUID.randomUUID().toString().replace("-", "").substring(0, 16).toUpperCase();
    }

    private String buildPaymentReturnUrl(
            String paymentId,
            Booking booking,
            CheckoutMethod method,
            PaymentOption paymentOption,
            BigDecimal amount
    ) {
        return "/payment/return"
                + "?paymentId=" + encode(paymentId)
                + "&bookingId=" + encode(booking.getBookingCode())
                + "&backendBookingId=" + booking.getId()
                + "&method=" + encode(method.apiValue)
                + "&paymentOption=" + encode(paymentOption.apiValue)
                + "&amount=" + encode(amount.stripTrailingZeros().toPlainString())
                + "&status=success";
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

    private enum PaymentOption {
        DEPOSIT("deposit"),
        FULL("full");

        private final String apiValue;

        PaymentOption(String apiValue) {
            this.apiValue = apiValue;
        }
    }
}
