package backend.staff.application.port.out;

import backend.entity.Staff;
import backend.entity.User;

import java.util.Optional;

public interface StaffAccountPort {
    boolean existsAccountByEmail(String email);

    boolean existsStaffProfileByEmail(String email);

    Optional<Staff> loadStaffById(Integer staffId);

    User saveAccount(User account);

    Staff saveStaff(Staff staff);

    void deleteStaffAndAccount(Staff staff, User account);
}
