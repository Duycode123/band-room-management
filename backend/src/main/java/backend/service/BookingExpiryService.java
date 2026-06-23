package backend.service;

import backend.entity.Booking;
import backend.entity.BookingStatus;
import backend.repository.BookingRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Auto-cancels CHO_THANH_TOAN bookings that stay unpaid past the configured grace period.
 * Without this, an abandoned pending booking would block its room/time slot forever, because
 * both the overlap query and the DB exclusion constraint treat every non-DA_HUY booking as busy.
 */
@Service
@RequiredArgsConstructor
@ConditionalOnProperty(name = "app.booking.expiry-sweep.enabled", havingValue = "true", matchIfMissing = true)
public class BookingExpiryService {

    private static final Logger log = LoggerFactory.getLogger(BookingExpiryService.class);

    private final BookingRepository bookingRepository;

    @Value("${app.booking.payment-expiration-minutes:15}")
    private long paymentExpirationMinutes;

    @Scheduled(fixedDelayString = "${app.booking.expiry-sweep-interval-ms:60000}")
    @Transactional
    public void expireStalePendingBookings() {
        LocalDateTime cutoff = LocalDateTime.now().minusMinutes(paymentExpirationMinutes);

        List<Booking> stale = bookingRepository.findStalePendingBookings(
                BookingStatus.CHO_THANH_TOAN,
                cutoff
        );

        if (stale.isEmpty()) {
            return;
        }

        stale.forEach(booking -> booking.setStatus(BookingStatus.DA_HUY));
        bookingRepository.saveAll(stale);

        log.info("Auto-cancelled {} unpaid booking(s) older than {} minutes", stale.size(), paymentExpirationMinutes);
    }
}
