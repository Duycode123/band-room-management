package backend.service;

import backend.entity.Booking;
import backend.entity.BookingStatus;
import backend.entity.PaymentTransaction;
import backend.entity.PaymentTransactionStatus;
import backend.repository.BookingRepository;
import backend.repository.PaymentTransactionRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.List;

/**
 * Periodic booking hygiene:
 * <ul>
 *   <li>Auto-cancels PENDING_PAYMENT bookings unpaid past the grace period (frees room slots).</li>
 *   <li>Auto-completes CHECKED_IN bookings after endTime (Vietnam wall-clock) so reviews unlock
 *       even when staff forgets to press "Hoàn tất".</li>
 * </ul>
 */
@Service
@RequiredArgsConstructor
@ConditionalOnProperty(name = "app.booking.expiry-sweep.enabled", havingValue = "true", matchIfMissing = true)
public class BookingExpiryService {

    private static final Logger log = LoggerFactory.getLogger(BookingExpiryService.class);
    private static final ZoneId STUDIO_ZONE = ZoneId.of("Asia/Ho_Chi_Minh");

    private final BookingRepository bookingRepository;
    private final PaymentTransactionRepository paymentTransactionRepository;

    @Value("${app.booking.payment-expiration-seconds:300}")
    private long paymentExpirationSeconds;

    @Scheduled(fixedDelayString = "${app.booking.expiry-sweep-interval-ms:60000}")
    @Transactional
    public void expireStalePendingBookings() {
        if (paymentExpirationSeconds <= 0) {
            return;
        }

        LocalDateTime cutoff = LocalDateTime.now().minusSeconds(paymentExpirationSeconds);

        List<PaymentTransaction> staleTransactions = paymentTransactionRepository.findStaleTransactions(
                List.of(PaymentTransactionStatus.INITIALIZED, PaymentTransactionStatus.PENDING),
                cutoff
        );

        List<Booking> bookingsFromTransactions = staleTransactions.stream()
                .map(PaymentTransaction::getBooking)
                .filter(booking -> booking.getStatus() == BookingStatus.PENDING_PAYMENT)
                .distinct()
                .toList();

        staleTransactions.forEach(transaction -> {
            transaction.setStatus(PaymentTransactionStatus.CANCELLED);
            transaction.setResponseCode("PAYMENT_TIMEOUT");
        });
        bookingsFromTransactions.forEach(booking -> booking.setStatus(BookingStatus.CANCELLED));

        if (!staleTransactions.isEmpty()) {
            paymentTransactionRepository.saveAll(staleTransactions);
            bookingRepository.saveAll(bookingsFromTransactions);
        }

        List<Booking> stale = bookingRepository.findStalePendingBookings(
                BookingStatus.PENDING_PAYMENT,
                cutoff
        );

        if (!stale.isEmpty()) {
            stale.forEach(booking -> booking.setStatus(BookingStatus.CANCELLED));
            bookingRepository.saveAll(stale);
        }

        int cancelledCount = stale.size() + bookingsFromTransactions.size();
        if (cancelledCount > 0 || !staleTransactions.isEmpty()) {
            log.info(
                    "Auto-cancelled {} unpaid booking(s) and {} payment transaction(s) older than {} seconds",
                    cancelledCount,
                    staleTransactions.size(),
                    paymentExpirationSeconds
            );
        }

        completeFinishedCheckedInBookings();
    }

    private void completeFinishedCheckedInBookings() {
        LocalDateTime nowVn = LocalDateTime.now(STUDIO_ZONE);
        List<Booking> finished = bookingRepository.findCheckedInBookingsPastEnd(
                BookingStatus.CHECKED_IN,
                nowVn
        );

        if (finished.isEmpty()) {
            return;
        }

        finished.forEach(booking -> booking.setStatus(BookingStatus.COMPLETED));
        bookingRepository.saveAll(finished);

        log.info(
                "Auto-completed {} checked-in booking(s) past endTime (studio clock {})",
                finished.size(),
                nowVn
        );
    }
}
