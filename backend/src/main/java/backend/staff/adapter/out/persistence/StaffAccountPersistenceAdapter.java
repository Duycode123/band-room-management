package backend.staff.adapter.out.persistence;

import backend.entity.Staff;
import backend.entity.User;
import backend.repository.StaffRepository;
import backend.repository.UserRepository;
import backend.staff.application.port.out.StaffAccountPort;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
@RequiredArgsConstructor
public class StaffAccountPersistenceAdapter implements StaffAccountPort {

    private final UserRepository userRepository;
    private final StaffRepository staffRepository;

    @Override
    public boolean existsAccountByEmail(String email) {
        return userRepository.existsByEmail(email);
    }

    @Override
    public boolean existsStaffProfileByEmail(String email) {
        return staffRepository.existsByEmailIgnoreCase(email);
    }

    @Override
    public Optional<Staff> loadStaffById(Integer staffId) {
        return staffRepository.findById(staffId);
    }

    @Override
    public User saveAccount(User account) {
        return userRepository.save(account);
    }

    @Override
    public Staff saveStaff(Staff staff) {
        return staffRepository.save(staff);
    }

    @Override
    public void deleteStaffAndAccount(Staff staff, User account) {
        try {
            staffRepository.delete(staff);
            staffRepository.flush();
            userRepository.delete(account);
            userRepository.flush();
        } catch (DataIntegrityViolationException exception) {
            throw new IllegalStateException("Khong the xoa nhan vien da co du lieu lien quan");
        }
    }
}
