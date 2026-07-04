package backend.staff.application.service;

import backend.entity.Role;
import backend.entity.Staff;
import backend.entity.User;
import backend.staff.application.model.StaffAccountResult;
import backend.staff.application.port.in.CreateStaffAccountUseCase;
import backend.staff.application.port.in.command.CreateStaffAccountCommand;
import backend.staff.application.port.out.StaffAccountPort;
import backend.staff.application.port.out.StaffPasswordPort;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Locale;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class StaffManagementUseCaseService implements CreateStaffAccountUseCase {

    public static final String DEFAULT_INITIAL_PASSWORD = "123123";

    private final StaffAccountPort staffAccountPort;
    private final StaffPasswordPort staffPasswordPort;

    @Override
    @Transactional
    public StaffAccountResult createStaffAccount(CreateStaffAccountCommand command) {
        String fullName = normalizeRequired(command.fullName(), "Ho ten nhan vien khong duoc de trong");
        String email = normalizeEmail(command.email());
        String initialPassword = normalizeInitialPassword(command.initialPassword());
        String phone = normalizeOptional(command.phone());

        if (staffAccountPort.existsAccountByEmail(email)) {
            throw new IllegalStateException("Email nay da co tai khoan");
        }
        if (staffAccountPort.existsStaffProfileByEmail(email)) {
            throw new IllegalStateException("Email nay da co ho so nhan vien");
        }

        User account = User.builder()
                .email(email)
                .password(staffPasswordPort.encodePassword(initialPassword))
                .role(Role.STAFF)
                .emailVerified(true)
                .build();
        User savedAccount = staffAccountPort.saveAccount(account);

        Staff staff = Staff.builder()
                .account(savedAccount)
                .fullName(fullName)
                .phone(phone)
                .email(email)
                .dateOfBirth(command.dateOfBirth())
                .build();
        Staff savedStaff = staffAccountPort.saveStaff(staff);

        return new StaffAccountResult(
                savedAccount.getId(),
                savedStaff.getId(),
                savedAccount.getEmail(),
                savedStaff.getFullName(),
                savedStaff.getPhone(),
                savedAccount.getRole().name(),
                initialPassword
        );
    }

    private String normalizeInitialPassword(String password) {
        if (password == null || password.trim().isBlank()) {
            return DEFAULT_INITIAL_PASSWORD;
        }
        return password.trim();
    }

    private String normalizeEmail(String email) {
        return normalizeRequired(email, "Email nhan vien khong duoc de trong").toLowerCase(Locale.ROOT);
    }

    private String normalizeRequired(String value, String message) {
        if (value == null || value.trim().isBlank()) {
            throw new IllegalArgumentException(message);
        }
        return value.trim();
    }

    private String normalizeOptional(String value) {
        if (value == null) {
            return null;
        }
        String normalized = value.trim();
        return normalized.isBlank() ? null : normalized;
    }
}
