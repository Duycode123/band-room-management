package backend.staff.application.service;

import backend.entity.Role;
import backend.entity.Staff;
import backend.entity.User;
import backend.exception.ResourceNotFoundException;
import backend.staff.application.model.StaffAccountResult;
import backend.staff.application.port.in.CreateStaffAccountUseCase;
import backend.staff.application.port.in.DeleteStaffAccountUseCase;
import backend.staff.application.port.in.UpdateStaffAccountUseCase;
import backend.staff.application.port.in.command.CreateStaffAccountCommand;
import backend.staff.application.port.in.command.DeleteStaffAccountCommand;
import backend.staff.application.port.in.command.UpdateStaffAccountCommand;
import backend.staff.application.port.out.StaffAccountPort;
import backend.staff.application.port.out.StaffPasswordPort;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Locale;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class StaffManagementUseCaseService implements CreateStaffAccountUseCase, UpdateStaffAccountUseCase, DeleteStaffAccountUseCase {

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

    @Override
    @Transactional
    public StaffAccountResult updateStaffAccount(UpdateStaffAccountCommand command) {
        Staff staff = staffAccountPort.loadStaffById(command.staffId())
                .orElseThrow(() -> new ResourceNotFoundException("Khong tim thay nhan vien"));
        User account = staff.getAccount();

        if (account == null || account.getRole() != Role.STAFF) {
            throw new IllegalStateException("Ho so nay khong phai tai khoan nhan vien");
        }

        String fullName = normalizeRequired(command.fullName(), "Ho ten nhan vien khong duoc de trong");
        String email = normalizeEmail(command.email());
        String phone = normalizeOptional(command.phone());

        if (!email.equalsIgnoreCase(account.getEmail())) {
            if (staffAccountPort.existsAccountByEmail(email)) {
                throw new IllegalStateException("Email nay da co tai khoan");
            }
            if (staffAccountPort.existsStaffProfileByEmail(email)) {
                throw new IllegalStateException("Email nay da co ho so nhan vien");
            }
        }

        account.setEmail(email);
        String newPassword = normalizeOptional(command.newPassword());
        if (newPassword != null) {
            account.setPassword(staffPasswordPort.encodePassword(newPassword));
        }

        staff.setFullName(fullName);
        staff.setEmail(email);
        staff.setPhone(phone);
        staff.setDateOfBirth(command.dateOfBirth());

        User savedAccount = staffAccountPort.saveAccount(account);
        Staff savedStaff = staffAccountPort.saveStaff(staff);

        return toResult(savedAccount, savedStaff, null);
    }

    @Override
    @Transactional
    public void deleteStaffAccount(DeleteStaffAccountCommand command) {
        Staff staff = staffAccountPort.loadStaffById(command.staffId())
                .orElseThrow(() -> new ResourceNotFoundException("Khong tim thay nhan vien"));
        User account = staff.getAccount();

        if (account == null || account.getRole() != Role.STAFF) {
            throw new IllegalStateException("Ho so nay khong phai tai khoan nhan vien");
        }

        staffAccountPort.deleteStaffAndAccount(staff, account);
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

    private StaffAccountResult toResult(User account, Staff staff, String initialPassword) {
        return new StaffAccountResult(
                account.getId(),
                staff.getId(),
                account.getEmail(),
                staff.getFullName(),
                staff.getPhone(),
                account.getRole().name(),
                initialPassword
        );
    }
}
