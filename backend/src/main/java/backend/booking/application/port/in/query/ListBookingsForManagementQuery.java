package backend.booking.application.port.in.query;

import backend.entity.BookingStatus;

public record ListBookingsForManagementQuery(
        BookingStatus status,
        String currentUserEmail
) {
}
