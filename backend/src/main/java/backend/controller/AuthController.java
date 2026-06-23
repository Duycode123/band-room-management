package backend.controller;

import backend.dto.request.LoginRequest;
import backend.dto.request.RegisterRequest;
import backend.dto.request.ResetPasswordRequest;
import backend.dto.response.AuthResponse;
import backend.entity.User;
import backend.repository.UserRepository;
import backend.service.AuthService;
import jakarta.mail.internet.MimeMessage;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping({"/api/auth", "/api/v1/auth"})
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:3000")
public class AuthController {
    private final AuthService authService;
    private final UserRepository userRepository;
    private final JavaMailSender mailSender;

    @PostMapping("/register")
    public AuthResponse register(@RequestBody @Valid RegisterRequest request) {
        return authService.register(request);
    }

    @PostMapping("/login")
    public AuthResponse login(@RequestBody @Valid LoginRequest request) {
        return authService.login(request);
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
