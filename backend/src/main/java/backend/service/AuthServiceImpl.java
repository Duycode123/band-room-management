package backend.service;

import backend.dto.request.LoginRequest;
import backend.dto.request.RegisterRequest;
import backend.dto.request.ResetPasswordRequest;
import backend.dto.response.AuthResponse;
import backend.entity.Customer;
import backend.entity.Role;
import backend.entity.User;
import backend.exception.AuthException;
import backend.repository.UserRepository;
import backend.repository.CustomerRepository;
import backend.security.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    private final UserRepository userRepository;
    private final CustomerRepository customerRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final TokenRevocationService tokenRevocationService;
    private final AuthenticationManager authenticationManager;

    @Override
    @Transactional
    public AuthResponse register(RegisterRequest request) {
        String email = request.getEmail().trim().toLowerCase();
        String phone = request.getPhone().trim();

        if (userRepository.existsByEmail(email)) {
            throw new AuthException("Email này đã được đăng ký sử dụng hệ thống!");
        }
        if (customerRepository.existsByPhone(phone)) {
            throw new AuthException("Số điện thoại này đã được đăng ký sử dụng hệ thống!");
        }

        User account = User.builder()
                .email(email)
                .password(passwordEncoder.encode(request.getPassword()))
                .role(Role.CUSTOMER)
                .build();

        account = userRepository.save(account);

        Customer customer = Customer.builder()
                .account(account)
                .fullName(request.getFullName().trim())
                .phone(request.getPhone().trim())
                .email(email)
                .build();

        customerRepository.save(customer);

        return AuthResponse.builder()
                .role(account.getRole() != null ? account.getRole().name() : "CUSTOMER")
                .build();
    }

    @Override
    public AuthResponse login(LoginRequest request) {
        String email = request.getEmail().trim().toLowerCase();

        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(email, request.getPassword()));

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Tài khoản hoặc mật khẩu không chính xác!"));

        String accessToken = jwtService.generateAccessToken(user);
        String refreshToken = jwtService.generateRefreshToken(user);

        return AuthResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .role(user.getRole() != null ? user.getRole().name() : "CUSTOMER")
                .build();
    }

    @Override
    @Transactional
    public AuthResponse refresh(String refreshToken) {
        if (refreshToken == null || refreshToken.isBlank()) {
            throw new BadCredentialsException("Không tìm thấy refresh token");
        }
        if (tokenRevocationService.isRevoked(refreshToken)) {
            throw new BadCredentialsException("Refresh token đã bị thu hồi");
        }

        String email;
        try {
            email = jwtService.extractUsername(refreshToken);
        } catch (RuntimeException ex) {
            throw new BadCredentialsException("Refresh token không hợp lệ", ex);
        }

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new BadCredentialsException("Tài khoản không còn tồn tại"));

        if (!jwtService.isRefreshTokenValid(refreshToken, user)) {
            throw new BadCredentialsException("Refresh token không hợp lệ hoặc đã hết hạn");
        }

        String newAccessToken = jwtService.generateAccessToken(user);
        String newRefreshToken;
        try {
            newRefreshToken = jwtService.rotateRefreshToken(user, refreshToken);
        } catch (RuntimeException ex) {
            throw new BadCredentialsException("Phiên đăng nhập đã hết hạn", ex);
        }

        tokenRevocationService.revoke(refreshToken);

        return AuthResponse.builder()
                .accessToken(newAccessToken)
                .refreshToken(newRefreshToken)
                .role(user.getRole().name())
                .build();
    }

    @Override
    public void logout(String accessToken, String refreshToken) {
        tokenRevocationService.revoke(accessToken);
        tokenRevocationService.revoke(refreshToken);
    }

    @Override
    @Transactional
    public void resetPassword(ResetPasswordRequest request) {
        User user = userRepository.findByResetToken(request.getToken())
                .orElseThrow(() -> new RuntimeException("Liên kết đổi mật khẩu không hợp lệ hoặc đã hết hạn!"));

        if (user.getResetTokenExpiresAt() == null
                || user.getResetTokenExpiresAt().isBefore(LocalDateTime.now())) {
            user.setResetToken(null);
            user.setResetTokenExpiresAt(null);
            userRepository.save(user);
            throw new RuntimeException("Liên kết đổi mật khẩu không hợp lệ hoặc đã hết hạn!");
        }

        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        user.setResetToken(null);
        user.setResetTokenExpiresAt(null);
        userRepository.save(user);
    }
}
