package backend.controller;

import backend.dto.request.CalculateBookingCostRequest;
import backend.dto.request.CreateBookingRequest;
import backend.dto.response.BookingCostResponse;
import backend.dto.response.BookingResponse;
import backend.service.BookingService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.LinkedHashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/bookings")
public class BookingController {

    private final BookingService bookingService;

    public BookingController(BookingService bookingService) {
        this.bookingService = bookingService;
    }

    @PostMapping("/calculate-cost")
    public ResponseEntity<?> calculateCost(@RequestBody CalculateBookingCostRequest request) {
        BookingCostResponse data = bookingService.calculateCost(request);

        return ResponseEntity.ok(success("Tính chi phí thuê phòng thành công", data));
    }

    @PostMapping
    public ResponseEntity<?> createBooking(
            @RequestBody CreateBookingRequest request,
            Authentication authentication
    ) {
        String customerEmail = authentication.getName();

        BookingResponse data = bookingService.createBooking(request, customerEmail);

        return ResponseEntity.ok(success("Đặt lịch thành công, vui lòng thanh toán", data));
    }

    private Map<String, Object> success(String message, Object data) {
        Map<String, Object> response = new LinkedHashMap<>();
        response.put("success", true);
        response.put("message", message);
        response.put("data", data);
        return response;
    }
}