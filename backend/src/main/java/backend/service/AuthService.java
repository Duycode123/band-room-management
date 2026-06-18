package backend.service;

import backend.dto.request.LoginRequest;
import backend.dto.request.RegisterRequest;
import backend.dto.request.ResetPasswordRequest; // Thêm dòng import này
import backend.dto.response.AuthResponse;

public interface AuthService {
    AuthResponse register(RegisterRequest request);
    AuthResponse login(LoginRequest request);
    
    // KHAI BÁO THÊM HÀM NÀY ĐỂ HẾT LỖI COMPILATION ERROR
    void resetPassword(ResetPasswordRequest request); 
}
