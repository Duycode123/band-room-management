package backend.controller;

import backend.booking.application.port.in.CalculateBookingCostUseCase;
import backend.booking.application.port.in.CreateBookingUseCase;
import backend.booking.application.port.in.GetCustomerBookingHistoryUseCase;
import backend.booking.application.port.in.command.CalculateBookingCostCommand;
import backend.booking.application.port.in.command.CreateBookingCommand;
import backend.booking.application.port.in.query.CustomerBookingHistoryQuery;
import backend.dto.request.CalculateBookingCostRequest;
import backend.dto.request.CreateBookingRequest;
import backend.dto.response.BookingCostResponse;
import backend.dto.response.BookingResponse;
import backend.dto.response.PagedResponse;
import backend.entity.BookingStatus;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/bookings")
public class BookingController {

    private final CalculateBookingCostUseCase calculateBookingCostUseCase;
    private final CreateBookingUseCase createBookingUseCase;
    private final GetCustomerBookingHistoryUseCase getCustomerBookingHistoryUseCase;

    public BookingController(
            CalculateBookingCostUseCase calculateBookingCostUseCase,
            CreateBookingUseCase createBookingUseCase,
            GetCustomerBookingHistoryUseCase getCustomerBookingHistoryUseCase
    ) {
        this.calculateBookingCostUseCase = calculateBookingCostUseCase;
        this.createBookingUseCase = createBookingUseCase;
        this.getCustomerBookingHistoryUseCase = getCustomerBookingHistoryUseCase;
    }

    @PostMapping("/calculate-cost")
    public ResponseEntity<?> calculateCost(@RequestBody CalculateBookingCostRequest request) {
        BookingCostResponse data = calculateBookingCostUseCase.calculateCost(
                new CalculateBookingCostCommand(
                        request.getRoomId(),
                        request.getStartTime(),
                        request.getEndTime(),
                        request.getCouponCode()
                )
        );

        return ResponseEntity.ok(success("Tinh chi phi thue phong thanh cong", data));
    }

    @PostMapping
    public ResponseEntity<?> createBooking(
            @RequestBody CreateBookingRequest request,
            Authentication authentication
    ) {
        String customerEmail = authentication.getName();

        BookingResponse data = createBookingUseCase.createBooking(
                new CreateBookingCommand(
                        request.getRoomId(),
                        request.getStartTime(),
                        request.getEndTime(),
                        request.getPaymentMethod(),
                        request.getCouponCode(),
                        request.getNote(),
                        customerEmail
                )
        );

        return ResponseEntity.ok(success("Dat lich thanh cong, vui long thanh toan", data));
    }

    @GetMapping("/my/history")
    public ResponseEntity<?> getMyBookingHistory(
            Authentication authentication,
            @RequestParam(required = false) BookingStatus status,
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime from,
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime to,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String direction
    ) {
        PagedResponse<BookingResponse> data = getCustomerBookingHistoryUseCase.getCustomerBookingHistory(
                new CustomerBookingHistoryQuery(
                        authentication.getName(),
                        status,
                        from,
                        to,
                        page,
                        size,
                        sortBy,
                        direction
                )
        );

        return ResponseEntity.ok(success("Lay lich su dat phong thanh cong", data));
    }

    private Map<String, Object> success(String message, Object data) {
        Map<String, Object> response = new LinkedHashMap<>();
        response.put("success", true);
        response.put("message", message);
        response.put("data", data);
        return response;
    }
}
