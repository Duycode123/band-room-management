package backend.staff.application.service;

import backend.entity.Role;
import backend.entity.Staff;
import backend.entity.User;
import backend.staff.application.port.in.command.CreateStaffAccountCommand;
import backend.staff.application.port.out.StaffAccountPort;
import backend.staff.application.port.out.StaffPasswordPort;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class StaffManagementUseCaseServiceTest {

    @Mock
    private StaffAccountPort staffAccountPort;

    @Mock
    private StaffPasswordPort staffPasswordPort;

    private StaffManagementUseCaseService staffManagementUseCaseService;

    @BeforeEach
    void setUp() {
        staffManagementUseCaseService = new StaffManagementUseCaseService(staffAccountPort, staffPasswordPort);
    }

    @Test
    void createStaffAccountCreatesAccountAndStaffProfileWithDefaultPassword() {
        when(staffAccountPort.existsAccountByEmail("staff@example.com")).thenReturn(false);
        when(staffAccountPort.existsStaffProfileByEmail("staff@example.com")).thenReturn(false);
        when(staffPasswordPort.encodePassword("123123")).thenReturn("encoded-password");
        when(staffAccountPort.saveAccount(any(User.class))).thenAnswer(invocation -> {
            User account = invocation.getArgument(0);
            account.setId(10);
            return account;
        });
        when(staffAccountPort.saveStaff(any(Staff.class))).thenAnswer(invocation -> {
            Staff staff = invocation.getArgument(0);
            staff.setId(3);
            return staff;
        });

        var result = staffManagementUseCaseService.createStaffAccount(new CreateStaffAccountCommand(
                "  Nguyen Van Staff  ",
                " Staff@Example.COM ",
                " 0909000111 ",
                LocalDate.of(2000, 1, 2),
                null
        ));

        ArgumentCaptor<User> accountCaptor = ArgumentCaptor.forClass(User.class);
        ArgumentCaptor<Staff> staffCaptor = ArgumentCaptor.forClass(Staff.class);
        verify(staffAccountPort).saveAccount(accountCaptor.capture());
        verify(staffAccountPort).saveStaff(staffCaptor.capture());

        assertEquals("staff@example.com", accountCaptor.getValue().getEmail());
        assertEquals("encoded-password", accountCaptor.getValue().getPassword());
        assertEquals(Role.STAFF, accountCaptor.getValue().getRole());
        assertTrue(accountCaptor.getValue().isEmailVerified());
        assertEquals(accountCaptor.getValue(), staffCaptor.getValue().getAccount());
        assertEquals("Nguyen Van Staff", staffCaptor.getValue().getFullName());
        assertEquals("0909000111", staffCaptor.getValue().getPhone());
        assertEquals("staff@example.com", staffCaptor.getValue().getEmail());
        assertEquals("123123", result.initialPassword());
    }

    @Test
    void createStaffAccountRejectsExistingAccountEmail() {
        when(staffAccountPort.existsAccountByEmail("staff@example.com")).thenReturn(true);

        assertThrows(
                IllegalStateException.class,
                () -> staffManagementUseCaseService.createStaffAccount(new CreateStaffAccountCommand(
                        "Staff",
                        "staff@example.com",
                        null,
                        null,
                        null
                ))
        );

        verify(staffAccountPort, never()).saveAccount(any());
        verify(staffAccountPort, never()).saveStaff(any());
    }
}
