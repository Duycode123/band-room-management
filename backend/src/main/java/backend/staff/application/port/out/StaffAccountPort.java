package backend.staff.application.port.out;

import backend.entity.Staff;
import backend.entity.User;

public interface StaffAccountPort {
    boolean existsAccountByEmail(String email);

    boolean existsStaffProfileByEmail(String email);

    User saveAccount(User account);

    Staff saveStaff(Staff staff);
}
