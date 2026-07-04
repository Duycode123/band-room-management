package backend.staff.application.model;

public record StaffAccountResult(
        Integer accountId,
        Integer staffId,
        String email,
        String fullName,
        String phone,
        String role,
        String initialPassword
) {
}
