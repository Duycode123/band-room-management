package backend.booking.domain.service;

import backend.entity.Booking;
import backend.entity.BookingStatus;
import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class BookingReviewPolicyTest {

    @Test
    void allowsReviewWhenCompletedEvenBeforeEndTime() {
        LocalDateTime now = LocalDateTime.of(2026, 7, 15, 10, 0);
        Booking booking = booking(
                BookingStatus.COMPLETED,
                now.plusHours(1),
                now.plusHours(2)
        );

        assertTrue(BookingReviewPolicy.canBeReviewed(booking, false, now));
    }

    @Test
    void allowsReviewForPaidBookingAfterEndTimeWithoutStaffCompletion() {
        LocalDateTime now = LocalDateTime.of(2026, 7, 15, 20, 0);
        Booking booking = booking(
                BookingStatus.PAID,
                LocalDateTime.of(2026, 7, 15, 18, 0),
                LocalDateTime.of(2026, 7, 15, 19, 0)
        );

        assertTrue(BookingReviewPolicy.canBeReviewed(booking, false, now));
    }

    @Test
    void allowsReviewForCheckedInBookingAfterEndTime() {
        LocalDateTime now = LocalDateTime.of(2026, 7, 15, 19, 5);
        Booking booking = booking(
                BookingStatus.CHECKED_IN,
                LocalDateTime.of(2026, 7, 15, 18, 0),
                LocalDateTime.of(2026, 7, 15, 19, 0)
        );

        assertTrue(BookingReviewPolicy.canBeReviewed(booking, false, now));
        assertTrue(BookingReviewPolicy.shouldAutoComplete(booking, now));
    }

    @Test
    void rejectsReviewBeforeEndTimeWhenNotCompleted() {
        LocalDateTime now = LocalDateTime.of(2026, 7, 15, 17, 30);
        Booking paid = booking(
                BookingStatus.PAID,
                LocalDateTime.of(2026, 7, 15, 18, 0),
                LocalDateTime.of(2026, 7, 15, 19, 0)
        );
        Booking checkedIn = booking(
                BookingStatus.CHECKED_IN,
                LocalDateTime.of(2026, 7, 15, 18, 0),
                LocalDateTime.of(2026, 7, 15, 19, 0)
        );

        assertFalse(BookingReviewPolicy.canBeReviewed(paid, false, now));
        assertFalse(BookingReviewPolicy.canBeReviewed(checkedIn, false, now));
        assertFalse(BookingReviewPolicy.shouldAutoComplete(checkedIn, now));
    }

    @Test
    void rejectsCancelledPendingAndAlreadyReviewed() {
        LocalDateTime now = LocalDateTime.of(2026, 7, 15, 20, 0);
        Booking cancelled = booking(
                BookingStatus.CANCELLED,
                LocalDateTime.of(2026, 7, 15, 18, 0),
                LocalDateTime.of(2026, 7, 15, 19, 0)
        );
        Booking pending = booking(
                BookingStatus.PENDING_PAYMENT,
                LocalDateTime.of(2026, 7, 15, 18, 0),
                LocalDateTime.of(2026, 7, 15, 19, 0)
        );
        Booking completed = booking(
                BookingStatus.COMPLETED,
                LocalDateTime.of(2026, 7, 15, 18, 0),
                LocalDateTime.of(2026, 7, 15, 19, 0)
        );

        assertFalse(BookingReviewPolicy.canBeReviewed(cancelled, false, now));
        assertFalse(BookingReviewPolicy.canBeReviewed(pending, false, now));
        assertFalse(BookingReviewPolicy.canBeReviewed(completed, true, now));
    }

    private static Booking booking(BookingStatus status, LocalDateTime start, LocalDateTime end) {
        return Booking.builder()
                .status(status)
                .startTime(start)
                .endTime(end)
                .build();
    }
}
