package backend.user.application.service;

import backend.dto.response.UserResponse;
import backend.entity.Customer;
import backend.entity.User;
import backend.user.application.model.UserProfileUpdateResult;
import backend.user.application.port.in.ChangeCurrentUserPasswordUseCase;
import backend.user.application.port.in.GetCurrentUserProfileUseCase;
import backend.user.application.port.in.UpdateCurrentUserProfileUseCase;
import backend.user.application.port.in.command.ChangeCurrentUserPasswordCommand;
import backend.user.application.port.in.command.UpdateCurrentUserProfileCommand;
import backend.user.application.port.in.query.GetCurrentUserProfileQuery;
import backend.user.application.port.out.UserProfileAccountPort;
import backend.user.application.port.out.UserProfileSecurityPort;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class UserProfileUseCaseService implements
        GetCurrentUserProfileUseCase,
        UpdateCurrentUserProfileUseCase,
        ChangeCurrentUserPasswordUseCase {

    private static final Pattern EMAIL_PATTERN = Pattern.compile("^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$");
    private static final Pattern PHONE_PATTERN = Pattern.compile("^[0-9]{9,11}$");

    private final UserProfileAccountPort userProfileAccountPort;
    private final UserProfileSecurityPort userProfileSecurityPort;

    @Override
    public UserResponse getProfile(GetCurrentUserProfileQuery query) {
        User user = getCurrentUser(query.currentUserEmail());
        Customer customer = userProfileAccountPort.loadCustomerByAccountEmail(user.getEmail()).orElse(null);
        return toUserResponse(user, customer);
    }

    @Override
    @Transactional
    public UserProfileUpdateResult updateProfile(UpdateCurrentUserProfileCommand command) {
        String fullName = normalizeRequired(command.fullName(), "Ho ten khong duoc de trong");
        String email = normalizeRequired(command.email(), "Email chua dung dinh dang").toLowerCase();
        String phone = normalizeOptional(command.phone());

        if (!EMAIL_PATTERN.matcher(email).matches()) {
            throw new IllegalArgumentException("Email chua dung dinh dang");
        }

        if (!phone.isBlank() && !PHONE_PATTERN.matcher(phone).matches()) {
            throw new IllegalArgumentException("So dien thoai phai co 9-11 chu so");
        }

        User user = getCurrentUser(command.currentUserEmail());
        if (!user.getEmail().equalsIgnoreCase(email) && userProfileAccountPort.existsUserByEmail(email)) {
            throw new IllegalArgumentException("Email nay da duoc su dung");
        }

        Customer customer = userProfileAccountPort.loadCustomerByAccountEmail(user.getEmail()).orElse(null);

        user.setEmail(email);
        User savedUser = userProfileAccountPort.saveUser(user);

        if (customer != null) {
            customer.setFullName(fullName);
            customer.setEmail(email);
            customer.setPhone(phone);
            customer = userProfileAccountPort.saveCustomer(customer);
        }

        return new UserProfileUpdateResult(
                toUserResponse(savedUser, customer),
                userProfileSecurityPort.generateAccessToken(savedUser),
                userProfileSecurityPort.generateRefreshToken(savedUser)
        );
    }

    @Override
    @Transactional
    public void changePassword(ChangeCurrentUserPasswordCommand command) {
        String currentPassword = normalizeRequired(
                command.currentPassword(),
                "Mat khau hien tai khong duoc trong"
        );
        String newPassword = normalizeRequired(
                command.newPassword(),
                "Mat khau moi phai co it nhat 8 ky tu"
        );
        String confirmPassword = normalizeRequired(
                command.confirmPassword(),
                "Mat khau xac nhan khong duoc trong"
        );

        if (newPassword.length() < 8) {
            throw new IllegalArgumentException("Mat khau moi phai co it nhat 8 ky tu");
        }

        if (!newPassword.equals(confirmPassword)) {
            throw new IllegalArgumentException("Mat khau xac nhan khong khop");
        }

        User user = getCurrentUser(command.currentUserEmail());
        if (!userProfileSecurityPort.matchesPassword(currentPassword, user.getPassword())) {
            throw new IllegalArgumentException("M\u1eadt kh\u1ea9u hi\u1ec7n t\u1ea1i kh\u00f4ng \u0111\u00fang");
        }

        user.setPassword(userProfileSecurityPort.encodePassword(newPassword));
        userProfileAccountPort.saveUser(user);
    }

    private User getCurrentUser(String currentUserEmail) {
        String email = normalizeRequired(currentUserEmail, "Phien dang nhap khong hop le");
        return userProfileAccountPort.loadUserByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("Khong tim thay tai khoan hien tai"));
    }

    private UserResponse toUserResponse(User user, Customer customer) {
        String email = user.getEmail();
        String fullName = customer != null ? customer.getFullName() : null;

        if (fullName == null || fullName.isBlank()) {
            fullName = email != null && email.contains("@") ? email.substring(0, email.indexOf("@")) : "Khach hang";
        }

        return UserResponse.builder()
                .id(user.getId())
                .fullName(fullName)
                .email(email)
                .phone(customer != null ? customer.getPhone() : "")
                .avatarUrl(null)
                .role(user.getRole().name())
                .build();
    }

    private String normalizeRequired(String value, String message) {
        if (value == null || value.trim().isBlank()) {
            throw new IllegalArgumentException(message);
        }

        return value.trim();
    }

    private String normalizeOptional(String value) {
        return value == null ? "" : value.trim();
    }
}
