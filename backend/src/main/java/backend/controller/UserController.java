package backend.controller;

import backend.common.ApiResponse;
import backend.dto.request.ChangePasswordRequest;
import backend.dto.request.UpdateProfileRequest;
import backend.dto.response.UserResponse;
import backend.security.AuthCookieService;
import backend.user.application.model.UserProfileUpdateResult;
import backend.user.application.port.in.ChangeCurrentUserPasswordUseCase;
import backend.user.application.port.in.GetCurrentUserProfileUseCase;
import backend.user.application.port.in.UpdateCurrentUserProfileUseCase;
import backend.user.application.port.in.command.ChangeCurrentUserPasswordCommand;
import backend.user.application.port.in.command.UpdateCurrentUserProfileCommand;
import backend.user.application.port.in.query.GetCurrentUserProfileQuery;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final GetCurrentUserProfileUseCase getCurrentUserProfileUseCase;
    private final UpdateCurrentUserProfileUseCase updateCurrentUserProfileUseCase;
    private final ChangeCurrentUserPasswordUseCase changeCurrentUserPasswordUseCase;
    private final AuthCookieService authCookieService;

    @GetMapping("/me")
    public UserResponse me(Authentication authentication) {
        return getCurrentUserProfileUseCase.getProfile(
                new GetCurrentUserProfileQuery(authentication == null ? null : authentication.getName())
        );
    }

    @RequestMapping(value = "/me", method = {RequestMethod.PUT, RequestMethod.PATCH})
    public ResponseEntity<UserResponse> updateMe(
            Authentication authentication,
            @RequestBody(required = false) UpdateProfileRequest request
    ) {
        UserProfileUpdateResult result = updateCurrentUserProfileUseCase.updateProfile(
                new UpdateCurrentUserProfileCommand(
                        authentication == null ? null : authentication.getName(),
                        request == null ? null : request.getFullName(),
                        request == null ? null : request.getEmail(),
                        request == null ? null : request.getPhone()
                )
        );

        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, authCookieService.accessCookie(result.accessToken()).toString())
                .header(HttpHeaders.SET_COOKIE, authCookieService.refreshCookie(result.refreshToken()).toString())
                .body(result.userResponse());
    }

    @PutMapping("/me/password")
    public ResponseEntity<ApiResponse<String>> changePassword(
            Authentication authentication,
            @RequestBody(required = false) ChangePasswordRequest request
    ) {
        changeCurrentUserPasswordUseCase.changePassword(new ChangeCurrentUserPasswordCommand(
                authentication == null ? null : authentication.getName(),
                request == null ? null : request.getCurrentPassword(),
                request == null ? null : request.getNewPassword(),
                request == null ? null : request.getConfirmPassword()
        ));

        return ResponseEntity.ok(
                ApiResponse.<String>builder()
                        .success(true)
                        .message("C\u1eadp nh\u1eadt m\u1eadt kh\u1ea9u th\u00e0nh c\u00f4ng")
                        .build()
        );
    }
}
