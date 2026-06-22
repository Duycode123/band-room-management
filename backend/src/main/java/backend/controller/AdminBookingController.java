package backend.controller;

import backend.dto.request.CancelBookingRequest;
import backend.dto.request.UpdateBookingStatusRequest;
import backend.dto.response.BookingResponse;
import backend.entity.BookingStatus;
import backend.service.BookingService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/bookings")
public class AdminBookingController {

    private final BookingService bookingService;

    public AdminBookingController(BookingService bookingService) {
        this.bookingService = bookingService;
    }

    @GetMapping
    public ResponseEntity<?> getAllBookings(
            @RequestParam(required = false) BookingStatus status,
            Authentication authentication
    ) {
        String currentUserEmail = authentication.getName();

        List<BookingResponse> data = bookingService.getAllBookings(status, currentUserEmail);

        return ResponseEntity.ok(success("Lấy danh sách đơn đặt phòng thành công", data));
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getBookingDetail(
            @PathVariable Long id,
            Authentication authentication
    ) {
        String currentUserEmail = authentication.getName();

        BookingResponse data = bookingService.getBookingDetailForManagement(id, currentUserEmail);

        return ResponseEntity.ok(success("Lấy chi tiết đơn đặt phòng thành công", data));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<?> updateBookingStatus(
            @PathVariable Long id,
            @RequestParam BookingStatus status,
            Authentication authentication
    ) {
        String currentUserEmail = authentication.getName();

        UpdateBookingStatusRequest request = new UpdateBookingStatusRequest();
        request.setStatus(status);

        BookingResponse data = bookingService.updateBookingStatus(id, request, currentUserEmail);

        return ResponseEntity.ok(success("Cập nhật trạng thái đơn đặt phòng thành công", data));
    }

    @PutMapping("/{id}/cancel")
    public ResponseEntity<?> cancelBooking(
            @PathVariable Long id,
            @RequestBody(required = false) CancelBookingRequest request,
            Authentication authentication
    ) {
        String currentUserEmail = authentication.getName();

        BookingResponse data = bookingService.cancelBookingForManagement(id, request, currentUserEmail);

        return ResponseEntity.ok(success("Hủy đơn đặt phòng thành công", data));
    }

    private Map<String, Object> success(String message, Object data) {
        Map<String, Object> response = new LinkedHashMap<>();
        response.put("success", true);
        response.put("message", message);
        response.put("data", data);
        return response;
    }
}