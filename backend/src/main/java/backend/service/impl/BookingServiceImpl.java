package backend.service.impl;

import backend.dto.request.CalculateBookingCostRequest;
import backend.dto.request.CancelBookingRequest;
import backend.dto.request.CreateBookingRequest;
import backend.dto.request.UpdateBookingStatusRequest;
import backend.dto.response.BookingCostResponse;
import backend.dto.response.BookingResponse;
import backend.entity.Booking;
import backend.entity.BookingStatus;
import backend.entity.Room;
import backend.entity.User;
import backend.exception.ResourceNotFoundException;
import backend.repository.BookingRepository;
import backend.repository.RoomRepository;
import backend.repository.UserRepository;
import backend.service.BookingService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Duration;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Service
@RequiredArgsConstructor
public class BookingServiceImpl implements BookingService {

    private final BookingRepository bookingRepository;
    private final RoomRepository roomRepository;
    private final UserRepository userRepository;

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
    public BookingResponse createBooking(CreateBookingRequest request, String customerEmail) {
        validateCreateBookingRequest(request);

        User customer = userRepository.findByEmail(customerEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy người dùng"));

        Room room = roomRepository.findById(request.getRoomId())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy phòng tập"));

        BigDecimal totalHours = calculateTotalHours(request.getStartTime(), request.getEndTime());
        BigDecimal pricePerHour = room.getRoomType().getPricePerHour();
        BigDecimal totalAmount = totalHours.multiply(pricePerHour);

        Booking booking = Booking.builder()
                .bookingCode(generateBookingCode())
                .customer(customer)
                .room(room)
                .startTime(request.getStartTime())
                .endTime(request.getEndTime())
                .totalHours(totalHours)
                .pricePerHour(pricePerHour)
                .totalAmount(totalAmount)
                .status(BookingStatus.PENDING_PAYMENT)
                .note(request.getNote())
                .paymentExpiredAt(LocalDateTime.now().plusMinutes(15))
                .build();

        Booking savedBooking = bookingRepository.save(booking);

        return new BookingResponse(savedBooking);
    }

    @Override
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
    public BookingResponse getBookingDetailForManagement(Long bookingId, String currentUserEmail) {
        User currentUser = getCurrentUser(currentUserEmail);
        checkAdminOrStaff(currentUser);

        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy đơn đặt phòng"));

        return new BookingResponse(booking);
    }

    @Override
    public BookingResponse updateBookingStatus(
            Long bookingId,
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
    public BookingResponse cancelBookingForManagement(
            Long bookingId,
            CancelBookingRequest request,
            String currentUserEmail
    ) {
        User currentUser = getCurrentUser(currentUserEmail);
        checkAdminOrStaff(currentUser);

        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy đơn đặt phòng"));

        if (booking.getStatus() == BookingStatus.COMPLETED) {
            throw new IllegalStateException("Không thể hủy đơn đã hoàn thành");
        }

        booking.setStatus(BookingStatus.CANCELLED);

        if (request != null) {
            booking.setCancellationReason(request.getReason());
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
            throw new IllegalArgumentException("Không thể đặt lịch trong quá khứ");
        }

        long minutes = Duration.between(request.getStartTime(), request.getEndTime()).toMinutes();

        if (minutes < 60) {
            throw new IllegalArgumentException("Thời lượng thuê tối thiểu là 1 giờ");
        }
    }

    private BigDecimal calculateTotalHours(LocalDateTime startTime, LocalDateTime endTime) {
        long minutes = Duration.between(startTime, endTime).toMinutes();

        return BigDecimal.valueOf(minutes)
                .divide(BigDecimal.valueOf(60), 2, RoundingMode.HALF_UP);
    }

    private String generateBookingCode() {
        String timePart = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMddHHmmss"));
        int random = (int) (Math.random() * 9000) + 1000;

        return "BR" + timePart + random;
    }

    private User getCurrentUser(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy người dùng"));
    }

    private void checkAdminOrStaff(User user) {
        String role = String.valueOf(user.getRole()).trim();

        if (!role.equals("ADMIN") && !role.equals("STAFF")) {
            throw new IllegalStateException("Bạn không có quyền quản lý đơn đặt phòng");
        }
    }
}