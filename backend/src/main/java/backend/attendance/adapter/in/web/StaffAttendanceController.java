package backend.attendance.adapter.in.web;

import backend.attendance.adapter.in.web.dto.AttendanceResponse;
import backend.attendance.application.port.in.CheckInShiftUseCase;
import backend.attendance.application.port.in.CheckOutShiftUseCase;
import backend.attendance.application.port.in.command.CheckInShiftCommand;
import backend.attendance.application.port.in.command.CheckOutShiftCommand;
import backend.common.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/staff/attendance")
@RequiredArgsConstructor
public class StaffAttendanceController {

    private final CheckInShiftUseCase checkInShiftUseCase;
    private final CheckOutShiftUseCase checkOutShiftUseCase;

    @PostMapping("/check-in")
    public ResponseEntity<ApiResponse<AttendanceResponse>> checkIn(Authentication authentication) {
        AttendanceResponse data = AttendanceResponse.from(
                checkInShiftUseCase.checkIn(new CheckInShiftCommand(authentication.getName()))
        );

        return ResponseEntity.ok(success("Da check-in luc " + data.checkInTime().toLocalTime(), data));
    }

    @PostMapping("/check-out")
    public ResponseEntity<ApiResponse<AttendanceResponse>> checkOut(Authentication authentication) {
        AttendanceResponse data = AttendanceResponse.from(
                checkOutShiftUseCase.checkOut(new CheckOutShiftCommand(authentication.getName()))
        );

        return ResponseEntity.ok(success("Da check-out. Tong thoi gian lam viec: " + data.workDuration() + " gio", data));
    }

    private <T> ApiResponse<T> success(String message, T data) {
        return ApiResponse.<T>builder()
                .success(true)
                .message(message)
                .data(data)
                .build();
    }
}
