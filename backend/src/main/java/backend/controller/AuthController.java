package backend.controller;

import backend.dto.request.LoginRequest;
import backend.dto.request.RegisterRequest;
import backend.dto.request.ResetPasswordRequest;
import backend.dto.response.AuthResponse;
import backend.entity.User;
import backend.repository.UserRepository;
import backend.service.AuthService;
import backend.security.AuthCookieService;
import jakarta.mail.internet.MimeMessage;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.CookieValue;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;
import java.util.UUID;
import java.time.LocalDateTime;

@RestController
@RequestMapping({"/api/auth", "/api/v1/auth"})
@RequiredArgsConstructor
public class AuthController {
    private final AuthService authService;
    private final AuthCookieService authCookieService;
    private final UserRepository userRepository;
    private final JavaMailSender mailSender;

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@RequestBody @Valid RegisterRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(authService.register(request));
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@RequestBody @Valid LoginRequest request) {
        AuthResponse response = authService.login(request);
        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, authCookieService.accessCookie(response.getAccessToken()).toString())
                .header(HttpHeaders.SET_COOKIE, authCookieService.refreshCookie(response.getRefreshToken()).toString())
                .body(response);
    }

    @PostMapping("/logout")
    public ResponseEntity<Map<String, String>> logout(
            @CookieValue(value = AuthCookieService.ACCESS_COOKIE_NAME, required = false) String accessToken,
            @CookieValue(value = AuthCookieService.REFRESH_COOKIE_NAME, required = false) String refreshToken
    ) {
        authService.logout(accessToken, refreshToken);
        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, authCookieService.clearAccessCookie().toString())
                .header(HttpHeaders.SET_COOKIE, authCookieService.clearRefreshCookie().toString())
                .body(Map.of("message", "Đăng xuất thành công"));
    }

    @GetMapping("/session")
    public ResponseEntity<Map<String, String>> session(Authentication authentication) {
        if (authentication == null
                || !authentication.isAuthenticated()
                || !(authentication.getPrincipal() instanceof User user)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "Phiên đăng nhập không hợp lệ"));
        }

        return ResponseEntity.ok(Map.of("role", user.getRole().name()));
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<Map<String, String>> forgotPassword(@RequestBody Map<String, String> request) {
        String email = request.get("email");
        if (email == null || email.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Email không được để trống"));
        }

        User user = userRepository.findByEmail(email.trim().toLowerCase()).orElse(null);
        if (user == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "Email không tồn tại"));
        }

        String token = UUID.randomUUID().toString();
        user.setResetToken(token);
        user.setResetTokenExpiresAt(LocalDateTime.now().plusMinutes(30));
        userRepository.save(user);

        String resetLink = "http://localhost:3000/reset-password?token=" + token;

        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setTo(user.getEmail());
            helper.setSubject("[BandHub Studio] Yêu cầu đặt lại mật khẩu tài khoản");
            helper.setText(buildResetPasswordEmail(resetLink), true);
            mailSender.send(message);

            return ResponseEntity.ok(Map.of(
                    "message",
                    "Hệ thống đã gửi liên kết đặt lại mật khẩu vào email của bạn"
            ));
        } catch (Exception ex) {
            return ResponseEntity.internalServerError().body(Map.of(
                    "message",
                    "Lỗi hệ thống: Không thể gửi email"
            ));
        }
    }

    @PostMapping("/reset-password")
    public ResponseEntity<Map<String, String>> resetPassword(@RequestBody ResetPasswordRequest request) {
        authService.resetPassword(request);
        return ResponseEntity.ok(Map.of("message", "Đổi mật khẩu thành công"));
    }

    private String buildResetPasswordEmail(String resetLink) {
        return """
                <div style="font-family: Arial, sans-serif; max-width: 540px; margin: 0 auto; padding: 20px; border: 1px solid #f0f0f0; border-radius: 12px;">
                  <h2 style="color: #FF7518; margin-bottom: 20px;">BandHub Studio</h2>
                  <p>Chúng tôi nhận được yêu cầu khôi phục mật khẩu. Vui lòng bấm vào nút dưới để đặt lại mật khẩu:</p>
                  <p style="text-align: center; margin: 20px 0;">
                    <a href="%s" style="background-color: #FF7518; color: white; padding: 12px 30px; text-decoration: none; border-radius: 8px; font-weight: bold;">Đặt lại mật khẩu</a>
                  </p>
                </div>
                """.formatted(resetLink);
    }
}
