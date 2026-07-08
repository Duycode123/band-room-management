package backend.staff.adapter.in.web.dto;

import backend.staff.application.model.StaffAccountResult;

public record StaffAccountResponse(
        Integer accountId,
        Integer staffId,
        String email,
        String fullName,
        String phone,
        String role,
        String initialPassword
) {
    public static StaffAccountResponse from(StaffAccountResult result) {
        return new StaffAccountResponse(
                result.accountId(),
                result.staffId(),
                result.email(),
                result.fullName(),
                result.phone(),
                result.role(),
                result.initialPassword()
        );
    }
}
