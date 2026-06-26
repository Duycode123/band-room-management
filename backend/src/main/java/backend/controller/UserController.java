package backend.controller;

import backend.common.ApiResponse;
import backend.dto.request.ChangePasswordRequest;
import backend.dto.request.UpdateProfileRequest;
import backend.dto.response.UserResponse;
import backend.entity.Customer;
import backend.entity.User;
import backend.repository.CustomerRepository;
import backend.repository.UserRepository;
import backend.security.AuthCookieService;
import backend.security.JwtService;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserRepository userRepository;
    private final CustomerRepository customerRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthCookieService authCookieService;

    @GetMapping("/me")
    public UserResponse me(Authentication authentication) {
        User user = getAuthenticatedUser(authentication);
        Customer customer = customerRepository.findByAccount_Email(user.getEmail()).orElse(null);

        return toUserResponse(user, customer);
    }

    @Transactional
    @RequestMapping(value = "/me", method = {RequestMethod.PUT, RequestMethod.PATCH})
    public ResponseEntity<UserResponse> updateMe(
            Authentication authentication,
            @RequestBody UpdateProfileRequest request
    ) {
        if (request == null) {
            throw new IllegalArgumentException("Dữ liệu hồ sơ không hợp lệ");
        }

        String fullName = request.getFullName() != null ? request.getFullName().trim() : "";
        String email = request.getEmail() != null ? request.getEmail().trim().toLowerCase() : "";
        String phone = request.getPhone() != null ? request.getPhone().trim() : "";

        if (fullName.isBlank()) {
            throw new IllegalArgumentException("Họ tên không được để trống");
        }

        if (!email.matches("^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$")) {
            throw new IllegalArgumentException("Email chưa đúng định dạng");
        }

        if (!phone.isBlank() && !phone.matches("^[0-9]{9,11}$")) {
            throw new IllegalArgumentException("Số điện thoại phải có 9-11 chữ số");
        }

        User user = getAuthenticatedUser(authentication);
        if (!user.getEmail().equalsIgnoreCase(email) && userRepository.existsByEmail(email)) {
            throw new IllegalArgumentException("Email này đã được sử dụng");
        }

        Customer customer = customerRepository.findByAccount_Email(user.getEmail()).orElse(null);
        user.setEmail(email);
        userRepository.save(user);

        if (customer != null) {
            customer.setFullName(fullName);
            customer.setEmail(email);
            customer.setPhone(phone);
            customerRepository.save(customer);
        }

        String accessToken = jwtService.generateAccessToken(user);
        String refreshToken = jwtService.generateRefreshToken(user);

        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, authCookieService.accessCookie(accessToken).toString())
                .header(HttpHeaders.SET_COOKIE, authCookieService.refreshCookie(refreshToken).toString())
                .body(toUserResponse(user, customer));
    }

    @PutMapping("/me/password")
    public ResponseEntity<ApiResponse<String>> changePassword(
            Authentication authentication,
            @RequestBody ChangePasswordRequest request
    ) {
        getAuthenticatedUser(authentication);

        if (request == null) {
            throw new IllegalArgumentException("Dữ liệu đổi mật khẩu không hợp lệ");
        }

        if (request.getCurrentPassword() == null || request.getCurrentPassword().isBlank()) {
            throw new IllegalArgumentException("Mật khẩu hiện tại không được trống");
        }

        if (request.getNewPassword() == null || request.getNewPassword().length() < 8) {
            throw new IllegalArgumentException("Mật khẩu mới phải có ít nhất 8 ký tự");
        }

        if (!request.getNewPassword().equals(request.getConfirmPassword())) {
            throw new IllegalArgumentException("Mật khẩu xác nhận không khớp");
        }

        User user = getAuthenticatedUser(authentication);

        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPassword())) {
            throw new IllegalArgumentException("Mật khẩu hiện tại không đúng");
        }

        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);

        return ResponseEntity.ok(
                ApiResponse.<String>builder()
                        .success(true)
                        .message("Cập nhật mật khẩu thành công")
                        .build()
        );
    }

    private User getAuthenticatedUser(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new IllegalArgumentException("Phiên đăng nhập không hợp lệ");
        }

        return userRepository
                .findByEmail(authentication.getName())
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy tài khoản hiện tại"));
    }

    private UserResponse toUserResponse(User user, Customer customer) {
        String email = user.getEmail();
        String fullName = customer != null ? customer.getFullName() : null;

        if (fullName == null || fullName.isBlank()) {
            fullName = email != null && email.contains("@") ? email.substring(0, email.indexOf("@")) : "Khách hàng";
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
}
