package backend.booking.application.port.in;

import backend.booking.application.port.in.query.ListBookingsForManagementQuery;
import backend.dto.response.BookingResponse;

import java.util.List;

public interface ListBookingsForManagementUseCase {
    List<BookingResponse> getAllBookings(ListBookingsForManagementQuery query);
}
