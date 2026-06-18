package backend.controller;

import backend.dto.request.LoginRequest;
import backend.dto.request.RegisterRequest;
import backend.dto.request.ResetPasswordRequest; // Thêm import DTO chuẩn
import backend.dto.response.AuthResponse;
import backend.service.AuthService;
import backend.repository.UserRepository;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import jakarta.mail.internet.MimeMessage;
import java.util.Map;
import java.util.UUID;

@RestController
// Sửa RequestMapping thành /api/v1/auth để đồng bộ hoàn toàn với cổng gọi của Frontend React
@RequestMapping("/api/v1/auth") 
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:5173")
public class AuthController {

    private final AuthService authService;
    
    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private JavaMailSender mailSender;

    @PostMapping("/register")
    public AuthResponse register(@RequestBody @Valid RegisterRequest request) {
        return authService.register(request);
    }

    @PostMapping("/login")
    public AuthResponse login(@RequestBody @Valid LoginRequest request) {
        return authService.login(request);
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<?> forgotPassword(@RequestBody Map<String, String> request) {
        String email = request.get("email");
        backend.entity.User user = userRepository.findByEmail(email).orElse(null);
        if (user == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "Email không tồn tại!"));
        }

        // 1. Tạo chuỗi mã Token UUID ngẫu nhiên
        String token = UUID.randomUUID().toString();
        
        // 2. SỬA LỖI QUAN TRỌNG: Lưu token này trực tiếp vào DB của User để đối chiếu khi khôi phục
        user.setResetToken(token);
        userRepository.save(user);

        String resetLink = "http://localhost:5173/reset-password?token=" + token;

        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setTo(email);
            helper.setSubject("[BandHub Studio] Yêu cầu đặt lại mật khẩu tài khoản");
            
            String htmlContent = "<div style='font-family: Arial, sans-serif; max-width: 540px; margin: 0 auto; padding: 20px; border: 1px solid #f0f0f0; border-radius: 12px;'>"
                    + "<h2 style='color: #FF7518; margin-bottom: 20px;'>BandHub Studio</h2>"
                    + "<p>Chúng tôi nhận được yêu cầu khôi phục mật khẩu. Vui lòng bấm vào nút dưới để đặt lại mật khẩu:</p>"
                    + "<p style='text-align: center; margin: 20px 0;'><a href='" + resetLink + "' style='background-color: #FF7518; color: white; padding: 12px 30px; text-decoration: none; border-radius: 8px; font-weight: bold;'>Đặt lại mật khẩu</a></p>"
                    + "</div>";
            
            helper.setText(htmlContent, true);
            mailSender.send(message);
            return ResponseEntity.ok(Map.of("message", "Hệ thống đã gửi liên kết đặt lại mật khẩu vào Email của bạn."));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("message", "Lỗi hệ thống: Không thể gửi email."));
        }
    }

    // 3. CHUẨN HÓA ENDPOINT ĐỔI MẬT KHẨU: Gọi trực tiếp sang tầng Service xử lý an toàn
    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(@RequestBody ResetPasswordRequest request) {
        // Hàm này tự động bốc Token UUID đối chiếu DB, băm mật khẩu mới và xóa token cũ
        authService.resetPassword(request);
        return ResponseEntity.ok(Map.of("message", "Đổi mật khẩu thành công!"));
    }
}