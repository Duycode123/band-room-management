package backend.staffschedule.adapter.out.persistence;

import backend.entity.Booking;
import backend.entity.BookingStatus;
import backend.repository.BookingRepository;
import backend.staffschedule.application.port.out.LoadStaffSchedulePort;
import backend.staffschedule.domain.model.StaffShift;
import backend.staffschedule.domain.model.StaffShiftBooking;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Component
@RequiredArgsConstructor
public class StaffSchedulePersistenceAdapter implements LoadStaffSchedulePort {

    private final StaffScheduleStaffRepository staffRepository;
    private final ShiftRepository shiftRepository;
    private final BookingRepository bookingRepository;
    private final StaffSchedulePersistenceMapper mapper;

    @Override
    public Optional<Integer> loadStaffIdByAccountEmail(String email) {
        return staffRepository.findByAccount_Email(email).map(staff -> staff.getId());
    }

    @Override
    public List<StaffShift> loadShifts(Integer staffId, LocalDate fromDate, LocalDate toDate) {
        return shiftRepository.findByStaff_IdAndDateBetweenOrderByDateAscStartTimeAsc(staffId, fromDate, toDate)
                .stream()
                .map(mapper::toDomain)
                .toList();
    }

    @Override
    public Optional<StaffShift> loadShift(Integer shiftId) {
        return shiftRepository.findById(shiftId).map(mapper::toDomain);
    }

    @Override
    public List<StaffShiftBooking> loadBookingsInShiftWindow(LocalDateTime shiftStart, LocalDateTime shiftEnd) {
        List<Booking> bookings = bookingRepository.findBookingsOverlappingWindow(
                shiftStart,
                shiftEnd,
                BookingStatus.CANCELLED
        );

        return bookings.stream()
                .map(mapper::toShiftBooking)
                .toList();
    }
}
