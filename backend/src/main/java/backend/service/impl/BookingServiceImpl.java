package backend.service.impl;

import backend.dto.request.CalculateBookingCostRequest;
import backend.dto.request.CancelBookingRequest;
import backend.dto.request.CreateBookingRequest;
import backend.dto.request.UpdateBookingStatusRequest;
import backend.dto.response.BookingCostResponse;
import backend.dto.response.BookingResponse;
import backend.dto.response.RoomAvailabilityResponse;
import backend.dto.response.TimeSlotResponse;
import backend.entity.Booking;
import backend.entity.BookingStatus;
import backend.entity.Customer;
import backend.entity.Room;
import backend.entity.RoomStatus;
import backend.entity.User;
import backend.exception.BookingConflictException;
import backend.exception.ForbiddenException;
import backend.exception.ResourceNotFoundException;
import backend.repository.BookingRepository;
import backend.repository.CustomerRepository;
import backend.repository.RoomRepository;
import backend.repository.UserRepository;
import backend.service.BookingService;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class BookingServiceImpl implements BookingService {

    private final BookingRepository bookingRepository;
    private final RoomRepository roomRepository;
    private final UserRepository userRepository;
    private final CustomerRepository customerRepository;

    @Override
    public BookingCostResponse calculateCost(CalculateBookingCostRequest request) {
        validateCostRequest(request);

        Room room = roomRepository.findById(request.getRoomId())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy phòng tập"));

        BigDecimal totalHours = calculateTotalHours(request.getStartTime(), request.getEndTime());
        BigDecimal pricePerHour = room.getRoomType().getPricePerHour();
        BigDecimal totalAmount = totalHours.multiply(pricePerHour);

        return new BookingCostResponse(
                room.getId(),
                room.getRoomName(),
                room.getRoomType().getTypeName(),
                request.getStartTime(),
                request.getEndTime(),
                totalHours,
                pricePerHour,
                totalAmount
        );
    }

    @Override
    @Transactional
    public BookingResponse createBooking(CreateBookingRequest request, String customerEmail) {
        validateCreateBookingRequest(request);

        Customer customer = customerRepository.findByAccount_Email(customerEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy hồ sơ khách hàng"));

        Room room = roomRepository.findByIdForUpdate(request.getRoomId())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy phòng tập"));

        if (room.getStatus() == RoomStatus.BAO_TRI) {
            throw new BookingConflictException("Phòng hiện không sẵn sàng để đặt");
        }

        if (hasBlockingBooking(room.getId(), request.getStartTime(), request.getEndTime())) {
            throw new BookingConflictException("Phòng đã có lịch trong khoảng thời gian này");
        }

        BigDecimal totalHours = calculateTotalHours(request.getStartTime(), request.getEndTime());
        BigDecimal pricePerHour = room.getRoomType().getPricePerHour();
        BigDecimal totalAmount = totalHours.multiply(pricePerHour);

        Booking booking = Booking.builder()
                .customer(customer)
                .room(room)
                .startTime(request.getStartTime())
                .endTime(request.getEndTime())
                .paymentMethod(request.getPaymentMethod())
                .pricePerHour(pricePerHour)
                .totalAmount(totalAmount)
                .status(BookingStatus.CHO_THANH_TOAN)
                .note(request.getNote())
                .build();

        Booking savedBooking;
        try {
            savedBooking = bookingRepository.saveAndFlush(booking);
        } catch (DataIntegrityViolationException exception) {
            throw new BookingConflictException(
                    "Phòng vừa được đặt bởi yêu cầu khác trong cùng khoảng thời gian",
                    exception
            );
        }

        return new BookingResponse(savedBooking);
    }

    @Override
    @Transactional(readOnly = true)
    public RoomAvailabilityResponse getAvailableSlots(
            Integer roomId,
            LocalDateTime from,
            LocalDateTime to
    ) {
        validateAvailabilityRange(roomId, from, to);

        Room room = roomRepository.findById(roomId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy phòng tập"));

        if (room.getStatus() == RoomStatus.BAO_TRI) {
            return new RoomAvailabilityResponse(
                    room.getId(),
                    room.getRoomName(),
                    from,
                    to,
                    false,
                    List.of()
            );
        }

        List<Booking> blockingBookings = findBlockingBookings(roomId, from, to);
        List<TimeSlotResponse> availableSlots = calculateAvailableSlots(
                from,
                to,
                blockingBookings
        );

        return new RoomAvailabilityResponse(
                room.getId(),
                room.getRoomName(),
                from,
                to,
                true,
                availableSlots
        );
    }

    @Override
    @Transactional(readOnly = true)
    public List<BookingResponse> getAllBookings(BookingStatus status, String currentUserEmail) {
        User currentUser = getCurrentUser(currentUserEmail);
        checkAdminOrStaff(currentUser);

        List<Booking> bookings;

        if (status != null) {
            bookings = bookingRepository.findByStatusOrderByCreatedAtDesc(status);
        } else {
            bookings = bookingRepository.findAllByOrderByCreatedAtDesc();
        }

        return bookings.stream()
                .map(BookingResponse::new)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public BookingResponse getBookingDetailForManagement(Integer bookingId, String currentUserEmail) {
        User currentUser = getCurrentUser(currentUserEmail);
        checkAdminOrStaff(currentUser);

        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy đơn đặt phòng"));

        return new BookingResponse(booking);
    }

    @Override
    @Transactional
    public BookingResponse updateBookingStatus(
            Integer bookingId,
            UpdateBookingStatusRequest request,
            String currentUserEmail
    ) {
        User currentUser = getCurrentUser(currentUserEmail);
        checkAdminOrStaff(currentUser);

        if (request == null || request.getStatus() == null) {
            throw new IllegalArgumentException("Trạng thái đơn không được để trống");
        }

        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy đơn đặt phòng"));

        booking.setStatus(request.getStatus());

        Booking savedBooking = bookingRepository.save(booking);

        return new BookingResponse(savedBooking);
    }

    @Override
    @Transactional
    public BookingResponse cancelBookingForManagement(
            Integer bookingId,
            CancelBookingRequest request,
            String currentUserEmail
    ) {
        User currentUser = getCurrentUser(currentUserEmail);
        checkAdminOrStaff(currentUser);

        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy đơn đặt phòng"));

        if (booking.getStatus() == BookingStatus.HOAN_TAT) {
            throw new IllegalStateException("Không thể hủy đơn đã hoàn thành");
        }

        booking.setStatus(BookingStatus.DA_HUY);

        if (request != null && request.getReason() != null && !request.getReason().isBlank()) {
            String cancellationNote = "Lý do hủy: " + request.getReason().trim();
            booking.setNote(booking.getNote() == null || booking.getNote().isBlank()
                    ? cancellationNote
                    : booking.getNote() + System.lineSeparator() + cancellationNote);
        }

        Booking savedBooking = bookingRepository.save(booking);

        return new BookingResponse(savedBooking);
    }

    private void validateCostRequest(CalculateBookingCostRequest request) {
        if (request.getRoomId() == null) {
            throw new IllegalArgumentException("roomId không được để trống");
        }

        if (request.getStartTime() == null || request.getEndTime() == null) {
            throw new IllegalArgumentException("Thời gian bắt đầu và kết thúc không được để trống");
        }

        if (!request.getStartTime().isBefore(request.getEndTime())) {
            throw new IllegalArgumentException("Thời gian bắt đầu phải nhỏ hơn thời gian kết thúc");
        }

        if (request.getStartTime().isBefore(LocalDateTime.now())) {
            throw new IllegalArgumentException("Không thể tính phí cho thời gian trong quá khứ");
        }

        long minutes = Duration.between(request.getStartTime(), request.getEndTime()).toMinutes();

        if (minutes < 60) {
            throw new IllegalArgumentException("Thời lượng thuê tối thiểu là 1 giờ");
        }
    }

    private void validateCreateBookingRequest(CreateBookingRequest request) {
        if (request == null) {
            throw new IllegalArgumentException("Thông tin đặt phòng không được để trống");
        }

        if (request.getRoomId() == null) {
            throw new IllegalArgumentException("roomId không được để trống");
        }

        if (request.getStartTime() == null || request.getEndTime() == null) {
            throw new IllegalArgumentException("Thời gian bắt đầu và kết thúc không được để trống");
        }

        if (request.getPaymentMethod() == null) {
            throw new IllegalArgumentException("Phương thức thanh toán không được để trống");
        }

        if (!request.getStartTime().isBefore(request.getEndTime())) {
            throw new IllegalArgumentException("Thời gian bắt đầu phải nhỏ hơn thời gian kết thúc");
        }

        if (request.getStartTime().isBefore(LocalDateTime.now())) {
            throw new IllegalArgumentException("Không thể đặt lịch trong quá khứ");
        }

        long minutes = Duration.between(request.getStartTime(), request.getEndTime()).toMinutes();

        if (minutes < 60) {
            throw new IllegalArgumentException("Thời lượng thuê tối thiểu là 1 giờ");
        }
    }

    private void validateAvailabilityRange(
            Integer roomId,
            LocalDateTime from,
            LocalDateTime to
    ) {
        if (roomId == null) {
            throw new IllegalArgumentException("roomId không được để trống");
        }

        if (from == null || to == null) {
            throw new IllegalArgumentException("Thời gian bắt đầu và kết thúc không được để trống");
        }

        if (!from.isBefore(to)) {
            throw new IllegalArgumentException("Thời gian bắt đầu phải nhỏ hơn thời gian kết thúc");
        }
    }

    private boolean hasBlockingBooking(
            Integer roomId,
            LocalDateTime startTime,
            LocalDateTime endTime
    ) {
        return !findBlockingBookings(roomId, startTime, endTime).isEmpty();
    }

    private List<Booking> findBlockingBookings(
            Integer roomId,
            LocalDateTime startTime,
            LocalDateTime endTime
    ) {
        return bookingRepository.findBlockingBookings(
                roomId,
                startTime,
                endTime,
                BookingStatus.DA_HUY
        );
    }

    private List<TimeSlotResponse> calculateAvailableSlots(
            LocalDateTime from,
            LocalDateTime to,
            List<Booking> blockingBookings
    ) {
        List<TimeSlotResponse> slots = new ArrayList<>();
        LocalDateTime cursor = from;

        for (Booking booking : blockingBookings) {
            LocalDateTime busyStart = booking.getStartTime().isBefore(from)
                    ? from
                    : booking.getStartTime();
            LocalDateTime busyEnd = booking.getEndTime().isAfter(to)
                    ? to
                    : booking.getEndTime();

            if (busyStart.isAfter(cursor)) {
                slots.add(new TimeSlotResponse(cursor, busyStart));
            }

            if (busyEnd.isAfter(cursor)) {
                cursor = busyEnd;
            }

            if (!cursor.isBefore(to)) {
                break;
            }
        }

        if (cursor.isBefore(to)) {
            slots.add(new TimeSlotResponse(cursor, to));
        }

        return List.copyOf(slots);
    }

    private BigDecimal calculateTotalHours(LocalDateTime startTime, LocalDateTime endTime) {
        long minutes = Duration.between(startTime, endTime).toMinutes();

        return BigDecimal.valueOf(minutes)
                .divide(BigDecimal.valueOf(60), 2, RoundingMode.HALF_UP);
    }

    private User getCurrentUser(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy người dùng"));
    }

    private void checkAdminOrStaff(User user) {
        String role = String.valueOf(user.getRole()).trim();

        if (!role.equals("ADMIN") && !role.equals("STAFF")) {
            throw new ForbiddenException("Bạn không có quyền quản lý đơn đặt phòng");
        }
    }
}
