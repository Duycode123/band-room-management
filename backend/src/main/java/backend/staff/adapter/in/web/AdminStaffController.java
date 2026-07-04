package backend.staff.adapter.in.web;

import backend.common.ApiResponse;
import backend.staff.adapter.in.web.dto.CreateStaffAccountRequest;
import backend.staff.adapter.in.web.dto.StaffAccountResponse;
import backend.staff.application.model.StaffAccountResult;
import backend.staff.application.port.in.CreateStaffAccountUseCase;
import backend.staff.application.port.in.command.CreateStaffAccountCommand;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/staff")
@RequiredArgsConstructor
public class AdminStaffController {

    private final CreateStaffAccountUseCase createStaffAccountUseCase;

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
}
