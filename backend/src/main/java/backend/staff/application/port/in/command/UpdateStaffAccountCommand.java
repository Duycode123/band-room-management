package backend.staff.application.port.in.command;

import java.time.LocalDate;

public record UpdateStaffAccountCommand(
        Integer staffId,
        String fullName,
        String email,
        String phone,
        LocalDate dateOfBirth,
        String newPassword
) {
}

