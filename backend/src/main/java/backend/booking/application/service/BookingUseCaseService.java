package backend.booking.application.service;

import backend.booking.application.model.PageResult;
import backend.booking.application.port.in.CalculateBookingCostUseCase;
import backend.booking.application.port.in.CancelBookingForManagementUseCase;
import backend.booking.application.port.in.CreateBookingUseCase;
import backend.booking.application.port.in.GetBookingManagementDetailUseCase;
import backend.booking.application.port.in.GetCustomerBookingHistoryUseCase;
import backend.booking.application.port.in.GetRoomAvailabilityUseCase;
import backend.booking.application.port.in.ListBookingsForManagementUseCase;
import backend.booking.application.port.in.UpdateBookingStatusUseCase;
import backend.booking.application.port.in.command.CalculateBookingCostCommand;
import backend.booking.application.port.in.command.CancelBookingForManagementCommand;
import backend.booking.application.port.in.command.CreateBookingCommand;
import backend.booking.application.port.in.command.UpdateBookingStatusCommand;
import backend.booking.application.port.in.query.CustomerBookingHistoryQuery;
import backend.booking.application.port.in.query.GetBookingManagementDetailQuery;
import backend.booking.application.port.in.query.GetRoomAvailabilityQuery;
import backend.booking.application.port.in.query.ListBookingsForManagementQuery;
import backend.booking.application.port.out.LoadBookingPort;
import backend.booking.application.port.out.LoadCustomerPort;
import backend.booking.application.port.out.LoadReviewPort;
import backend.booking.application.port.out.LoadRoomPort;
import backend.booking.application.port.out.LoadUserPort;
import backend.booking.application.port.out.SaveBookingPort;
import backend.booking.application.port.out.SearchCustomerBookingsPort;
import backend.booking.application.port.out.model.CustomerBookingHistoryCriteria;
import backend.dto.response.BookingCostResponse;
import backend.dto.response.BookingResponse;
import backend.dto.response.PagedResponse;
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
@Transactional(readOnly = true)
public class BookingUseCaseService implements
        CalculateBookingCostUseCase,
        CreateBookingUseCase,
        GetCustomerBookingHistoryUseCase,
        GetRoomAvailabilityUseCase,
        ListBookingsForManagementUseCase,
        GetBookingManagementDetailUseCase,
        UpdateBookingStatusUseCase,
        CancelBookingForManagementUseCase {

    private final LoadRoomPort loadRoomPort;
    private final LoadCustomerPort loadCustomerPort;
    private final LoadUserPort loadUserPort;
    private final LoadBookingPort loadBookingPort;
    private final SaveBookingPort saveBookingPort;
    private final SearchCustomerBookingsPort searchCustomerBookingsPort;
    private final LoadReviewPort loadReviewPort;

    @Override
    public BookingCostResponse calculateCost(CalculateBookingCostCommand command) {
        validateCostRequest(command);

        Room room = loadRoomPort.loadRoom(command.roomId())
                .orElseThrow(() -> new ResourceNotFoundException("Khong tim thay phong tap"));

        BigDecimal totalHours = calculateTotalHours(command.startTime(), command.endTime());
        BigDecimal pricePerHour = room.getRoomType().getPricePerHour();
        BigDecimal totalAmount = totalHours.multiply(pricePerHour);

        return new BookingCostResponse(
                room.getId(),
                room.getRoomName(),
                room.getRoomType().getTypeName(),
                command.startTime(),
                command.endTime(),
                totalHours,
                pricePerHour,
                totalAmount
        );
    }

    @Override
    @Transactional
    public BookingResponse createBooking(CreateBookingCommand command) {
        validateCreateBookingRequest(command);

        Customer customer = loadCustomerPort.loadCustomerByAccountEmail(command.customerEmail())
                .orElseThrow(() -> new ResourceNotFoundException("Khong tim thay ho so khach hang"));

        Room room = loadRoomPort.loadRoomForUpdate(command.roomId())
                .orElseThrow(() -> new ResourceNotFoundException("Khong tim thay phong tap"));

        if (room.getStatus() == RoomStatus.MAINTENANCE) {
            throw new BookingConflictException("Phong hien khong san sang de dat");
        }

        if (hasBlockingBooking(room.getId(), command.startTime(), command.endTime())) {
            throw new BookingConflictException("Phong da co lich trong khoang thoi gian nay");
        }

        BigDecimal totalHours = calculateTotalHours(command.startTime(), command.endTime());
        BigDecimal pricePerHour = room.getRoomType().getPricePerHour();
        BigDecimal totalAmount = totalHours.multiply(pricePerHour);

        Booking booking = Booking.builder()
                .customer(customer)
                .room(room)
                .startTime(command.startTime())
                .endTime(command.endTime())
                .paymentMethod(command.paymentMethod())
                .pricePerHour(pricePerHour)
                .totalAmount(totalAmount)
                .status(BookingStatus.PENDING_PAYMENT)
                .note(command.note())
                .build();

        Booking savedBooking;
        try {
            savedBooking = saveBookingPort.saveAndFlush(booking);
        } catch (DataIntegrityViolationException exception) {
            throw new BookingConflictException(
                    "Phong vua duoc dat boi yeu cau khac trong cung khoang thoi gian",
                    exception
            );
        }

        return new BookingResponse(savedBooking);
    }

    @Override
    public PagedResponse<BookingResponse> getCustomerBookingHistory(CustomerBookingHistoryQuery query) {
        validateHistoryQuery(query);

        Customer customer = loadCustomerPort.loadCustomerByAccountEmail(query.customerEmail())
                .orElseThrow(() -> new ResourceNotFoundException("Khong tim thay ho so khach hang"));

        String sortProperty = resolveSortProperty(query.sortBy());
        String sortDirection = resolveSortDirection(query.direction());

        PageResult<Booking> bookingPage = searchCustomerBookingsPort.searchCustomerBookings(
                new CustomerBookingHistoryCriteria(
                        customer.getId(),
                        query.status(),
                        query.from(),
                        query.to(),
                        query.page(),
                        query.size(),
                        sortProperty,
                        sortDirection
                )
        );

        return PagedResponse.of(
                bookingPage.content().stream().map(this::toBookingResponse).toList(),
                bookingPage.page(),
                bookingPage.size(),
                bookingPage.totalElements(),
                bookingPage.totalPages(),
                bookingPage.first(),
                bookingPage.last()
        );
    }

    @Override
    public RoomAvailabilityResponse getAvailableSlots(GetRoomAvailabilityQuery query) {
        validateAvailabilityRange(query.roomId(), query.from(), query.to());

        Room room = loadRoomPort.loadRoom(query.roomId())
                .orElseThrow(() -> new ResourceNotFoundException("Khong tim thay phong tap"));

        if (room.getStatus() == RoomStatus.MAINTENANCE) {
            return new RoomAvailabilityResponse(
                    room.getId(),
                    room.getRoomName(),
                    query.from(),
                    query.to(),
                    false,
                    List.of()
            );
        }

        List<Booking> blockingBookings = findBlockingBookings(query.roomId(), query.from(), query.to());
        List<TimeSlotResponse> availableSlots = calculateAvailableSlots(
                query.from(),
                query.to(),
                blockingBookings
        );

        return new RoomAvailabilityResponse(
                room.getId(),
                room.getRoomName(),
                query.from(),
                query.to(),
                true,
                availableSlots
        );
    }

    @Override
    public List<BookingResponse> getAllBookings(ListBookingsForManagementQuery query) {
        User currentUser = getCurrentUser(query.currentUserEmail());
        checkAdminOrStaff(currentUser);

        List<Booking> bookings = query.status() == null
                ? loadBookingPort.loadAllBookingsForManagement()
                : loadBookingPort.loadBookingsForManagementByStatus(query.status());

        return bookings.stream()
                .map(BookingResponse::new)
                .toList();
    }

    @Override
    public BookingResponse getBookingDetail(GetBookingManagementDetailQuery query) {
        User currentUser = getCurrentUser(query.currentUserEmail());
        checkAdminOrStaff(currentUser);

        Booking booking = loadBookingPort.loadBooking(query.bookingId())
                .orElseThrow(() -> new ResourceNotFoundException("Khong tim thay don dat phong"));

        return new BookingResponse(booking);
    }

    @Override
    @Transactional
    public BookingResponse updateBookingStatus(UpdateBookingStatusCommand command) {
        User currentUser = getCurrentUser(command.currentUserEmail());
        checkAdminOrStaff(currentUser);

        if (command.status() == null) {
            throw new IllegalArgumentException("Trang thai don khong duoc de trong");
        }

        Booking booking = loadBookingPort.loadBooking(command.bookingId())
                .orElseThrow(() -> new ResourceNotFoundException("Khong tim thay don dat phong"));

        booking.setStatus(command.status());

        Booking savedBooking = saveBookingPort.save(booking);

        return new BookingResponse(savedBooking);
    }

    @Override
    @Transactional
    public BookingResponse cancelBooking(CancelBookingForManagementCommand command) {
        User currentUser = getCurrentUser(command.currentUserEmail());
        checkAdminOrStaff(currentUser);

        Booking booking = loadBookingPort.loadBooking(command.bookingId())
                .orElseThrow(() -> new ResourceNotFoundException("Khong tim thay don dat phong"));

        if (booking.getStatus() == BookingStatus.COMPLETED) {
            throw new IllegalStateException("Khong the huy don da hoan thanh");
        }

        booking.setStatus(BookingStatus.CANCELLED);

        if (command.reason() != null && !command.reason().isBlank()) {
            String cancellationNote = "Ly do huy: " + command.reason().trim();
            booking.setNote(booking.getNote() == null || booking.getNote().isBlank()
                    ? cancellationNote
                    : booking.getNote() + System.lineSeparator() + cancellationNote);
        }

        Booking savedBooking = saveBookingPort.save(booking);

        return new BookingResponse(savedBooking);
    }

    private void validateCostRequest(CalculateBookingCostCommand command) {
        if (command.roomId() == null) {
            throw new IllegalArgumentException("roomId khong duoc de trong");
        }

        if (command.startTime() == null || command.endTime() == null) {
            throw new IllegalArgumentException("Thoi gian bat dau va ket thuc khong duoc de trong");
        }

        if (!command.startTime().isBefore(command.endTime())) {
            throw new IllegalArgumentException("Thoi gian bat dau phai nho hon thoi gian ket thuc");
        }

        if (command.startTime().isBefore(LocalDateTime.now())) {
            throw new IllegalArgumentException("Khong the tinh phi cho thoi gian trong qua khu");
        }

        long minutes = Duration.between(command.startTime(), command.endTime()).toMinutes();

        if (minutes < 60) {
            throw new IllegalArgumentException("Thoi luong thue toi thieu la 1 gio");
        }
    }

    private void validateCreateBookingRequest(CreateBookingCommand command) {
        if (command.roomId() == null) {
            throw new IllegalArgumentException("roomId khong duoc de trong");
        }

        if (command.startTime() == null || command.endTime() == null) {
            throw new IllegalArgumentException("Thoi gian bat dau va ket thuc khong duoc de trong");
        }

        if (command.paymentMethod() == null) {
            throw new IllegalArgumentException("Phuong thuc thanh toan khong duoc de trong");
        }

        if (!command.startTime().isBefore(command.endTime())) {
            throw new IllegalArgumentException("Thoi gian bat dau phai nho hon thoi gian ket thuc");
        }

        if (command.startTime().isBefore(LocalDateTime.now())) {
            throw new IllegalArgumentException("Khong the dat lich trong qua khu");
        }

        long minutes = Duration.between(command.startTime(), command.endTime()).toMinutes();

        if (minutes < 60) {
            throw new IllegalArgumentException("Thoi luong thue toi thieu la 1 gio");
        }
    }

    private void validateHistoryQuery(CustomerBookingHistoryQuery query) {
        if (query.page() < 0) {
            throw new IllegalArgumentException("Trang khong duoc nho hon 0");
        }
        if (query.size() < 1 || query.size() > 100) {
            throw new IllegalArgumentException("Kich thuoc trang phai tu 1 den 100");
        }
        if (query.from() != null && query.to() != null && query.from().isAfter(query.to())) {
            throw new IllegalArgumentException("Thoi gian bat dau khong duoc sau thoi gian ket thuc");
        }
    }

    private String resolveSortProperty(String sortBy) {
        return switch (sortBy) {
            case "createdAt", "startTime", "endTime", "totalAmount", "status" -> sortBy;
            default -> throw new IllegalArgumentException(
                    "sortBy chi nhan createdAt, startTime, endTime, totalAmount hoac status"
            );
        };
    }

    private String resolveSortDirection(String direction) {
        if (direction == null) {
            throw new IllegalArgumentException("direction chi nhan asc hoac desc");
        }

        String normalizedDirection = direction.trim().toUpperCase();
        if (!normalizedDirection.equals("ASC") && !normalizedDirection.equals("DESC")) {
            throw new IllegalArgumentException("direction chi nhan asc hoac desc");
        }

        return normalizedDirection;
    }

    private void validateAvailabilityRange(
            Integer roomId,
            LocalDateTime from,
            LocalDateTime to
    ) {
        if (roomId == null) {
            throw new IllegalArgumentException("roomId khong duoc de trong");
        }

        if (from == null || to == null) {
            throw new IllegalArgumentException("Thoi gian bat dau va ket thuc khong duoc de trong");
        }

        if (!from.isBefore(to)) {
            throw new IllegalArgumentException("Thoi gian bat dau phai nho hon thoi gian ket thuc");
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
        return loadBookingPort.loadBlockingBookings(
                roomId,
                startTime,
                endTime,
                BookingStatus.CANCELLED
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
        return loadUserPort.loadUserByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Khong tim thay nguoi dung"));
    }

    private BookingResponse toBookingResponse(Booking booking) {
        return new BookingResponse(
                booking,
                booking.getId() != null && loadReviewPort.existsReviewByBookingId(booking.getId())
        );
    }

    private void checkAdminOrStaff(User user) {
        String role = String.valueOf(user.getRole()).trim();

        if (!role.equals("ADMIN") && !role.equals("STAFF")) {
            throw new ForbiddenException("Ban khong co quyen quan ly don dat phong");
        }
    }
}
