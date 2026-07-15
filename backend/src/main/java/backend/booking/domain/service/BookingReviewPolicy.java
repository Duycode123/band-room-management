package backend.booking.domain.service;

import backend.entity.Booking;
import backend.entity.BookingStatus;

import java.time.LocalDateTime;
import java.time.ZoneId;

/**
 * Hybrid review policy:
 * - ALWAYS allowed when status is {@code COMPLETED}
 * - ALSO allowed after booking {@code endTime} when the booking was paid/checked-in
 *   (covers staff forgetting to press "Hoàn tất")
 * - Never for cancelled / unpaid pending bookings
 *
 * Booking wall-clock times are stored as Vietnam local {@link LocalDateTime} values,
 * so "now" is resolved in {@code Asia/Ho_Chi_Minh}.
 */
public final class BookingReviewPolicy {

    public static final ZoneId STUDIO_ZONE = ZoneId.of("Asia/Ho_Chi_Minh");

    private BookingReviewPolicy() {
    }

    public static LocalDateTime nowInStudio() {
        return LocalDateTime.now(STUDIO_ZONE);
    }

    public static boolean isSessionFinished(Booking booking) {
        return isSessionFinished(booking, nowInStudio());
    }

    public static boolean isSessionFinished(Booking booking, LocalDateTime now) {
        return booking.getEndTime() != null && !now.isBefore(booking.getEndTime());
    }

    public static boolean canBeReviewed(Booking booking, boolean alreadyReviewed) {
        return canBeReviewed(booking, alreadyReviewed, nowInStudio());
    }

    public static boolean canBeReviewed(Booking booking, boolean alreadyReviewed, LocalDateTime now) {
        if (alreadyReviewed || booking == null || booking.getStatus() == null) {
            return false;
        }

        BookingStatus status = booking.getStatus();
        if (status == BookingStatus.CANCELLED || status == BookingStatus.PENDING_PAYMENT) {
            return false;
        }

        if (status == BookingStatus.COMPLETED) {
            return true;
        }

        return isPaidLike(status) && isSessionFinished(booking, now);
    }

    public static boolean shouldAutoComplete(Booking booking) {
        return shouldAutoComplete(booking, nowInStudio());
    }

    public static boolean shouldAutoComplete(Booking booking, LocalDateTime now) {
        return booking != null
                && booking.getStatus() == BookingStatus.CHECKED_IN
                && isSessionFinished(booking, now);
    }

    public static String denialReason(Booking booking, boolean alreadyReviewed) {
        return denialReason(booking, alreadyReviewed, nowInStudio());
    }

    public static String denialReason(Booking booking, boolean alreadyReviewed, LocalDateTime now) {
        if (alreadyReviewed) {
            return "Don dat phong nay da duoc danh gia";
        }

        if (booking.getStatus() == BookingStatus.CANCELLED) {
            return "Khong the danh gia don da huy";
        }

        if (booking.getStatus() == BookingStatus.PENDING_PAYMENT) {
            return "Chi co the danh gia sau khi don da thanh toan va ket thuc buoi tap";
        }

        if (canBeReviewed(booking, false, now)) {
            return null;
        }

        return "Chi co the danh gia sau khi buoi tap ket thuc (nhan vien hoan tat hoac qua gio ket thuc)";
    }

    private static boolean isPaidLike(BookingStatus status) {
        return status == BookingStatus.PAID
                || status == BookingStatus.DEPOSIT_PAID
                || status == BookingStatus.CHECKED_IN;
    }
}
