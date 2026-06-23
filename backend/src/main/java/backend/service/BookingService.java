package backend.service;

import backend.dto.request.CalculateBookingCostRequest;
import backend.dto.request.CancelBookingRequest;
import backend.dto.request.CreateBookingRequest;
import backend.dto.request.UpdateBookingStatusRequest;
import backend.dto.response.BookingCostResponse;
import backend.dto.response.BookingResponse;
import backend.entity.BookingStatus;

import java.util.List;

public interface BookingService {

    BookingCostResponse calculateCost(CalculateBookingCostRequest request);

    BookingResponse createBooking(CreateBookingRequest request, String customerEmail);

    List<BookingResponse> getAllBookings(BookingStatus status, String currentUserEmail);

    BookingResponse getBookingDetailForManagement(Long bookingId, String currentUserEmail);

    BookingResponse updateBookingStatus(Long bookingId, UpdateBookingStatusRequest request, String currentUserEmail);

    BookingResponse cancelBookingForManagement(Long bookingId, CancelBookingRequest request, String currentUserEmail);
}