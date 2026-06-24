package backend.service;

import backend.dto.request.CalculateBookingCostRequest;
import backend.dto.request.CancelBookingRequest;
import backend.dto.request.CreateBookingRequest;
import backend.dto.request.UpdateBookingStatusRequest;
import backend.dto.response.BookingCostResponse;
import backend.dto.response.BookingResponse;
import backend.dto.response.PagedResponse;
import backend.dto.response.RoomAvailabilityResponse;
import backend.entity.BookingStatus;

import java.time.LocalDateTime;
import java.util.List;

public interface BookingService {

    BookingCostResponse calculateCost(CalculateBookingCostRequest request);

    BookingResponse createBooking(CreateBookingRequest request, String customerEmail);

    PagedResponse<BookingResponse> getMyBookingHistory(
            String customerEmail,
            BookingStatus status,
            LocalDateTime from,
            LocalDateTime to,
            int page,
            int size,
            String sortBy,
            String direction
    );

    RoomAvailabilityResponse getAvailableSlots(Integer roomId, LocalDateTime from, LocalDateTime to);

    List<BookingResponse> getAllBookings(BookingStatus status, String currentUserEmail);

    BookingResponse getBookingDetailForManagement(Integer bookingId, String currentUserEmail);

    BookingResponse updateBookingStatus(Integer bookingId, UpdateBookingStatusRequest request, String currentUserEmail);

    BookingResponse cancelBookingForManagement(Integer bookingId, CancelBookingRequest request, String currentUserEmail);
}
