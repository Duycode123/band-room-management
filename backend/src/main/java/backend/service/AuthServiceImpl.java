package backend.service;

import backend.dto.request.LoginRequest;
import backend.dto.request.RegisterRequest;
import backend.dto.request.ResetPasswordRequest; // Thêm import này
import backend.dto.response.AuthResponse;
import backend.entity.User;
import backend.entity.Role;
import backend.repository.UserRepository;
import backend.security.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional; // Thêm import này

@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;

    @Override
    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Email này đã được đăng ký sử dụng hệ thống!");
        }

        // Khớp chuẩn Enum CUSTOMER trong dự án của bạn
        Role userRole = request.getRole() != null ? request.getRole() : Role.CUSTOMER;

        User user = User.builder()
                .fullName(request.getFullName())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .role(userRole)
                .status(true)
                .build();

        userRepository.save(user);

        // FIX CHUẨN: Gọi đúng tên hàm generateAccessToken và generateRefreshToken trong JwtService của bạn
        String accessToken = jwtService.generateAccessToken(user);
        String refreshToken = jwtService.generateRefreshToken(user);

        return AuthResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .role(user.getRole() != null ? user.getRole().name() : "CUSTOMER")
                .build();
    }

    @Override
    public AuthResponse login(LoginRequest request) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        request.getEmail(),
                        request.getPassword()
                )
        );

        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("Tài khoản hoặc mật khẩu không chính xác!"));

        // FIX CHUẨN: Gọi đúng tên hàm generateAccessToken và generateRefreshToken trong JwtService của bạn
        String accessToken = jwtService.generateAccessToken(user);
        String refreshToken = jwtService.generateRefreshToken(user);

        return AuthResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .role(user.getRole() != null ? user.getRole().name() : "CUSTOMER")
                .build();
    }

    // ==================== BỔ SUNG HÀM ĐỔI MẬT KHẨU THEO TOKEN UUID ====================
    @Override
    @Transactional
    public void resetPassword(ResetPasswordRequest request) {
        // 1. Tìm user trong database bằng mã Token UUID truyền từ URL lên
        User user = userRepository.findByResetToken(request.getToken())
                .orElseThrow(() -> new RuntimeException("Liên kết đổi mật khẩu không hợp lệ hoặc đã hết hạn!"));

        // 2. Băm mật khẩu mới và ghi đè vào object cũ (giữ nguyên ID để Hibernate sinh lệnh UPDATE)
        user.setPassword(passwordEncoder.encode(request.getNewPassword()));

        // 3. Xóa mã token này đi để link mail mất tác dụng, đảm bảo tính bảo mật
        user.setResetToken(null);

        // 4. Lưu lại vào DB
        userRepository.save(user);
    }
}
