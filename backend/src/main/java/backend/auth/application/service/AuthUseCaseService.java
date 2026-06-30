package backend.auth.application.service;

import backend.auth.application.port.in.LoginUserUseCase;
import backend.auth.application.port.in.LogoutUseCase;
import backend.auth.application.port.in.RefreshSessionUseCase;
import backend.auth.application.port.in.RegisterUserUseCase;
import backend.auth.application.port.in.RequestPasswordResetUseCase;
import backend.auth.application.port.in.ResetPasswordUseCase;
import backend.auth.application.port.in.command.LoginUserCommand;
import backend.auth.application.port.in.command.LogoutCommand;
import backend.auth.application.port.in.command.RefreshSessionCommand;
import backend.auth.application.port.in.command.RegisterUserCommand;
import backend.auth.application.port.in.command.RequestPasswordResetCommand;
import backend.auth.application.port.in.command.ResetPasswordCommand;
import backend.auth.application.port.out.AuthAccountPort;
import backend.auth.application.port.out.AuthSecurityPort;
import backend.auth.application.port.out.PasswordResetNotificationPort;
import backend.dto.response.AuthResponse;
import backend.entity.Customer;
import backend.entity.Role;
import backend.entity.User;
import backend.exception.AuthException;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AuthUseCaseService implements
        RegisterUserUseCase,
        LoginUserUseCase,
        RefreshSessionUseCase,
        LogoutUseCase,
        RequestPasswordResetUseCase,
        ResetPasswordUseCase {

    private final AuthAccountPort authAccountPort;
    private final AuthSecurityPort authSecurityPort;
    private final PasswordResetNotificationPort passwordResetNotificationPort;

    @Override
    @Transactional
    public AuthResponse register(RegisterUserCommand command) {
        String fullName = normalizeRequired(command.fullName(), "Ho ten khong duoc de trong");
        String email = normalizeEmail(command.email());
        String phone = normalizeRequired(command.phone(), "So dien thoai khong duoc de trong");
        String password = normalizeRequired(command.password(), "Mat khau khong duoc de trong");

        if (authAccountPort.existsUserByEmail(email)) {
            throw new AuthException("Email nay da duoc dang ky su dung he thong!");
        }
        if (authAccountPort.existsCustomerByPhone(phone)) {
            throw new AuthException("So dien thoai nay da duoc dang ky su dung he thong!");
        }

        User account = User.builder()
                .email(email)
                .password(authSecurityPort.encodePassword(password))
                .role(Role.CUSTOMER)
                .build();

        User savedUser = authAccountPort.saveUser(account);

        Customer customer = Customer.builder()
                .account(savedUser)
                .fullName(fullName)
                .phone(phone)
                .email(email)
                .build();

        authAccountPort.saveCustomer(customer);

        return AuthResponse.builder()
                .role(savedUser.getRole() != null ? savedUser.getRole().name() : Role.CUSTOMER.name())
                .build();
    }

    @Override
    public AuthResponse login(LoginUserCommand command) {
        String email = normalizeEmail(command.email());
        String password = normalizeRequired(command.password(), "Mat khau khong duoc de trong");

        authSecurityPort.authenticate(email, password);

        User user = authAccountPort.loadUserByEmail(email)
                .orElseThrow(() -> new BadCredentialsException("Tai khoan hoac mat khau khong chinh xac"));

        return AuthResponse.builder()
                .accessToken(authSecurityPort.generateAccessToken(user))
                .refreshToken(authSecurityPort.generateRefreshToken(user))
                .role(user.getRole() != null ? user.getRole().name() : Role.CUSTOMER.name())
                .build();
    }

    @Override
    @Transactional
    public AuthResponse refresh(RefreshSessionCommand command) {
        String refreshToken = normalizeRequired(command.refreshToken(), "Khong tim thay refresh token");

        if (authSecurityPort.isTokenRevoked(refreshToken)) {
            throw new BadCredentialsException("Refresh token da bi thu hoi");
        }

        String email;
        try {
            email = authSecurityPort.extractUsername(refreshToken);
        } catch (RuntimeException ex) {
            throw new BadCredentialsException("Refresh token khong hop le", ex);
        }

        User user = authAccountPort.loadUserByEmail(email)
                .orElseThrow(() -> new BadCredentialsException("Tai khoan khong con ton tai"));

        if (!authSecurityPort.isRefreshTokenValid(refreshToken, user)) {
            throw new BadCredentialsException("Refresh token khong hop le hoac da het han");
        }

        String newAccessToken = authSecurityPort.generateAccessToken(user);
        String newRefreshToken;
        try {
            newRefreshToken = authSecurityPort.rotateRefreshToken(user, refreshToken);
        } catch (RuntimeException ex) {
            throw new BadCredentialsException("Phien dang nhap da het han", ex);
        }

        authSecurityPort.revokeToken(refreshToken);

        return AuthResponse.builder()
                .accessToken(newAccessToken)
                .refreshToken(newRefreshToken)
                .role(user.getRole() != null ? user.getRole().name() : Role.CUSTOMER.name())
                .build();
    }

    @Override
    public void logout(LogoutCommand command) {
        authSecurityPort.revokeToken(command.accessToken());
        authSecurityPort.revokeToken(command.refreshToken());
    }

    @Override
    @Transactional
    public void requestPasswordReset(RequestPasswordResetCommand command) {
        String email = normalizeEmail(command.email());
        String resetPasswordUrlBase = normalizeRequired(
                command.resetPasswordUrlBase(),
                "Duong dan dat lai mat khau khong hop le"
        );

        User user = authAccountPort.loadUserByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("Email khong ton tai"));

        String token = UUID.randomUUID().toString();
        user.setResetToken(token);
        user.setResetTokenExpiresAt(LocalDateTime.now().plusMinutes(30));
        authAccountPort.saveUser(user);

        passwordResetNotificationPort.sendPasswordResetEmail(
                user.getEmail(),
                resetPasswordUrlBase + token
        );
    }

    @Override
    @Transactional
    public void resetPassword(ResetPasswordCommand command) {
        String token = normalizeRequired(command.token(), "Token dat lai mat khau khong hop le");
        String newPassword = normalizeRequired(command.newPassword(), "Mat khau moi khong duoc de trong");

        User user = authAccountPort.loadUserByResetToken(token)
                .orElseThrow(() -> new IllegalArgumentException(
                        "Lien ket doi mat khau khong hop le hoac da het han!"
                ));

        if (user.getResetTokenExpiresAt() == null
                || user.getResetTokenExpiresAt().isBefore(LocalDateTime.now())) {
            user.setResetToken(null);
            user.setResetTokenExpiresAt(null);
            authAccountPort.saveUser(user);
            throw new IllegalArgumentException("Lien ket doi mat khau khong hop le hoac da het han!");
        }

        user.setPassword(authSecurityPort.encodePassword(newPassword));
        user.setResetToken(null);
        user.setResetTokenExpiresAt(null);
        authAccountPort.saveUser(user);
    }

    private String normalizeRequired(String value, String message) {
        if (value == null || value.trim().isBlank()) {
            throw new IllegalArgumentException(message);
        }

        return value.trim();
    }

    private String normalizeEmail(String email) {
        return normalizeRequired(email, "Email khong duoc de trong").toLowerCase();
    }
}
