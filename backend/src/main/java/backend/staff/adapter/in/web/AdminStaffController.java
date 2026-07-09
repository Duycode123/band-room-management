package backend.staff.adapter.in.web;

import backend.common.ApiResponse;
import backend.staff.adapter.in.web.dto.CreateStaffAccountRequest;
import backend.staff.adapter.in.web.dto.StaffAccountResponse;
import backend.staff.adapter.in.web.dto.UpdateStaffAccountRequest;
import backend.staff.application.model.StaffAccountResult;
import backend.staff.application.port.in.CreateStaffAccountUseCase;
import backend.staff.application.port.in.DeleteStaffAccountUseCase;
import backend.staff.application.port.in.UpdateStaffAccountUseCase;
import backend.staff.application.port.in.command.CreateStaffAccountCommand;
import backend.staff.application.port.in.command.DeleteStaffAccountCommand;
import backend.staff.application.port.in.command.UpdateStaffAccountCommand;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/staff")
@RequiredArgsConstructor
public class AdminStaffController {

    private final CreateStaffAccountUseCase createStaffAccountUseCase;
    private final UpdateStaffAccountUseCase updateStaffAccountUseCase;
    private final DeleteStaffAccountUseCase deleteStaffAccountUseCase;

    @PostMapping
    public ResponseEntity<ApiResponse<StaffAccountResponse>> createStaffAccount(
            @Valid @RequestBody CreateStaffAccountRequest request
    ) {
        StaffAccountResult result = createStaffAccountUseCase.createStaffAccount(
                new CreateStaffAccountCommand(
                        request.fullName(),
                        request.email(),
                        request.phone(),
                        request.dateOfBirth(),
                        request.initialPassword()
                )
        );

        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.<StaffAccountResponse>builder()
                .success(true)
                .message("Tao tai khoan nhan vien thanh cong")
                .data(StaffAccountResponse.from(result))
                .build());
    }

    @PutMapping("/{staffId}")
    public ResponseEntity<ApiResponse<StaffAccountResponse>> updateStaffAccount(
            @PathVariable Integer staffId,
            @Valid @RequestBody UpdateStaffAccountRequest request
    ) {
        StaffAccountResult result = updateStaffAccountUseCase.updateStaffAccount(
                new UpdateStaffAccountCommand(
                        staffId,
                        request.fullName(),
                        request.email(),
                        request.phone(),
                        request.dateOfBirth(),
                        request.newPassword()
                )
        );

        return ResponseEntity.ok(ApiResponse.<StaffAccountResponse>builder()
                .success(true)
                .message("Cap nhat tai khoan nhan vien thanh cong")
                .data(StaffAccountResponse.from(result))
                .build());
    }

    @DeleteMapping("/{staffId}")
    public ResponseEntity<ApiResponse<Void>> deleteStaffAccount(@PathVariable Integer staffId) {
        deleteStaffAccountUseCase.deleteStaffAccount(new DeleteStaffAccountCommand(staffId));

        return ResponseEntity.ok(ApiResponse.<Void>builder()
                .success(true)
                .message("Xoa tai khoan nhan vien thanh cong")
                .data(null)
                .build());
    }
}
