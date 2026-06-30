package backend.booking.adapter.out.persistence;

import backend.booking.application.model.PageResult;
import backend.booking.application.port.out.LoadBookingPort;
import backend.booking.application.port.out.LoadCustomerPort;
import backend.booking.application.port.out.LoadReviewPort;
import backend.booking.application.port.out.LoadRoomPort;
import backend.booking.application.port.out.LoadUserPort;
import backend.booking.application.port.out.SaveBookingPort;
import backend.booking.application.port.out.SearchCustomerBookingsPort;
import backend.booking.application.port.out.model.CustomerBookingHistoryCriteria;
import backend.entity.Booking;
import backend.entity.BookingStatus;
import backend.entity.Customer;
import backend.entity.Room;
import backend.entity.User;
import backend.repository.BookingRepository;
import backend.repository.CustomerRepository;
import backend.repository.ReviewRepository;
import backend.repository.RoomRepository;
import backend.repository.UserRepository;
import jakarta.persistence.criteria.Predicate;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Component
@RequiredArgsConstructor
public class BookingPersistenceAdapter implements
        LoadRoomPort,
        LoadCustomerPort,
        LoadUserPort,
        LoadBookingPort,
        LoadReviewPort,
        SaveBookingPort,
        SearchCustomerBookingsPort {

    private final BookingRepository bookingRepository;
    private final RoomRepository roomRepository;
    private final UserRepository userRepository;
    private final CustomerRepository customerRepository;
    private final ReviewRepository reviewRepository;

    @Override
    public Optional<Room> loadRoom(Integer roomId) {
        return roomRepository.findById(roomId);
    }

    @Override
    public Optional<Room> loadRoomForUpdate(Integer roomId) {
        return roomRepository.findByIdForUpdate(roomId);
    }

    @Override
    public Optional<Customer> loadCustomerByAccountEmail(String email) {
        return customerRepository.findByAccount_Email(email);
    }

    @Override
    public Optional<User> loadUserByEmail(String email) {
        return userRepository.findByEmail(email);
    }

    @Override
    public Optional<Booking> loadBooking(Integer bookingId) {
        return bookingRepository.findById(bookingId);
    }

    @Override
    public List<Booking> loadBlockingBookings(
            Integer roomId,
            LocalDateTime startTime,
            LocalDateTime endTime,
            BookingStatus cancelledStatus
    ) {
        return bookingRepository.findBlockingBookings(roomId, startTime, endTime, cancelledStatus);
    }

    @Override
    public List<Booking> loadAllBookingsForManagement() {
        return bookingRepository.findAllByOrderByCreatedAtDesc();
    }

    @Override
    public List<Booking> loadBookingsForManagementByStatus(BookingStatus status) {
        return bookingRepository.findByStatusOrderByCreatedAtDesc(status);
    }

    @Override
    public boolean existsReviewByBookingId(Integer bookingId) {
        return reviewRepository.existsByBooking_Id(bookingId);
    }

    @Override
    public Booking save(Booking booking) {
        return bookingRepository.save(booking);
    }

    @Override
    public Booking saveAndFlush(Booking booking) {
        return bookingRepository.saveAndFlush(booking);
    }

    @Override
    public PageResult<Booking> searchCustomerBookings(CustomerBookingHistoryCriteria criteria) {
        Specification<Booking> historySpecification = (root, query, criteriaBuilder) -> {
            List<Predicate> predicates = new ArrayList<>();
            predicates.add(criteriaBuilder.equal(root.get("customer").get("id"), criteria.customerId()));

            if (criteria.status() != null) {
                predicates.add(criteriaBuilder.equal(root.get("status"), criteria.status()));
            }
            if (criteria.from() != null) {
                predicates.add(criteriaBuilder.greaterThanOrEqualTo(root.get("startTime"), criteria.from()));
            }
            if (criteria.to() != null) {
                predicates.add(criteriaBuilder.lessThanOrEqualTo(root.get("startTime"), criteria.to()));
            }

            return criteriaBuilder.and(predicates.toArray(Predicate[]::new));
        };

        Page<Booking> bookingPage = bookingRepository.findAll(
                historySpecification,
                PageRequest.of(
                        criteria.page(),
                        criteria.size(),
                        Sort.by(Sort.Direction.fromString(criteria.direction()), criteria.sortBy())
                )
        );

        return new PageResult<>(
                bookingPage.getContent(),
                bookingPage.getNumber(),
                bookingPage.getSize(),
                bookingPage.getTotalElements(),
                bookingPage.getTotalPages(),
                bookingPage.isFirst(),
                bookingPage.isLast()
        );
    }
}
