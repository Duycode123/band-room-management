package backend.user.application.service;

import backend.dto.response.NotificationSettingsResponse;
import backend.dto.response.UserResponse;
import backend.entity.Role;
import backend.entity.Staff;
import backend.entity.User;
import backend.entity.UserNotificationSettings;
import backend.user.application.port.in.command.ChangeCurrentUserPasswordCommand;
import backend.user.application.port.in.command.UpdateCurrentUserNotificationSettingsCommand;
import backend.user.application.port.in.query.GetCurrentUserProfileQuery;
import backend.user.application.port.out.UserProfileAccountPort;
import backend.user.application.port.out.UserProfileSecurityPort;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class UserProfileUseCaseServiceTest {

    @Mock
    private UserProfileAccountPort userProfileAccountPort;

    @Mock
    private UserProfileSecurityPort userProfileSecurityPort;

    private UserProfileUseCaseService userProfileUseCaseService;

    @BeforeEach
    void setUp() {
        userProfileUseCaseService = new UserProfileUseCaseService(
                userProfileAccountPort,
                userProfileSecurityPort
        );
    }

    @Test
    void getProfileUsesStaffProfileForStaffAccount() {
        User user = staffUser();
        Staff staff = Staff.builder()
                .id(5)
                .account(user)
                .fullName("Vinh Nguyen")
                .email("vinh@example.com")
                .phone("0912345678")
                .build();

        when(userProfileAccountPort.loadUserByEmail("vinh@example.com")).thenReturn(Optional.of(user));
        when(userProfileAccountPort.loadCustomerByAccountEmail("vinh@example.com")).thenReturn(Optional.empty());
        when(userProfileAccountPort.loadStaffByAccountEmail("vinh@example.com")).thenReturn(Optional.of(staff));

        UserResponse response = userProfileUseCaseService.getProfile(
                new GetCurrentUserProfileQuery("vinh@example.com")
        );

        assertEquals("Vinh Nguyen", response.getFullName());
        assertEquals("0912345678", response.getPhone());
        assertEquals("STAFF", response.getRole());
    }

    @Test
    void updateNotificationSettingsPersistsCurrentUserSettings() {
        User user = staffUser();
        UserNotificationSettings settings = UserNotificationSettings.builder()
                .id(2)
                .account(user)
                .newBooking(true)
                .bookingReminder(true)
                .shiftReminder(true)
                .roomIssue(true)
                .equipmentIssue(true)
                .build();

        when(userProfileAccountPort.loadUserByEmail("vinh@example.com")).thenReturn(Optional.of(user));
        when(userProfileAccountPort.loadNotificationSettingsByAccountEmail("vinh@example.com")).thenReturn(Optional.of(settings));
        when(userProfileAccountPort.saveNotificationSettings(any(UserNotificationSettings.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        NotificationSettingsResponse response = userProfileUseCaseService.updateNotificationSettings(
                new UpdateCurrentUserNotificationSettingsCommand(
                        "vinh@example.com",
                        false,
                        true,
                        false,
                        true,
                        false
                )
        );

        ArgumentCaptor<UserNotificationSettings> settingsCaptor = ArgumentCaptor.forClass(UserNotificationSettings.class);
        verify(userProfileAccountPort).saveNotificationSettings(settingsCaptor.capture());

        assertEquals(false, response.isNewBooking());
        assertEquals(false, response.isShiftReminder());
        assertEquals(false, response.isEquipmentIssue());
        assertEquals(false, settingsCaptor.getValue().isNewBooking());
    }

    @Test
    void changePasswordRejectsWrongCurrentPassword() {
        User user = staffUser();

        when(userProfileAccountPort.loadUserByEmail("vinh@example.com")).thenReturn(Optional.of(user));
        when(userProfileSecurityPort.matchesPassword("wrong-password", "encoded-password")).thenReturn(false);

        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class, () ->
                userProfileUseCaseService.changePassword(new ChangeCurrentUserPasswordCommand(
                        "vinh@example.com",
                        "wrong-password",
                        "new-password",
                        "new-password"
                ))
        );

        assertEquals("Mật khẩu hiện tại không đúng.", exception.getMessage());
        verify(userProfileAccountPort, never()).saveUser(any(User.class));
    }

    @Test
    void changePasswordRejectsNewPasswordSameAsCurrentPassword() {
        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class, () ->
                userProfileUseCaseService.changePassword(new ChangeCurrentUserPasswordCommand(
                        "vinh@example.com",
                        "same-password",
                        "same-password",
                        "same-password"
                ))
        );

        assertEquals("Mat khau moi khong duoc trung voi mat khau hien tai", exception.getMessage());
        verify(userProfileAccountPort, never()).saveUser(any(User.class));
    }

    private User staffUser() {
        return User.builder()
                .id(1)
                .email("vinh@example.com")
                .password("encoded-password")
                .role(Role.STAFF)
                .build();
    }
}
