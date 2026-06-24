package backend.service;

import backend.dto.request.CreateBookingRequest;
import backend.dto.response.RoomAvailabilityResponse;
import backend.entity.Booking;
import backend.entity.BookingStatus;
import backend.entity.Customer;
import backend.entity.PaymentMethod;
import backend.entity.Room;
import backend.entity.RoomStatus;
import backend.entity.RoomType;
import backend.entity.User;
import backend.exception.BookingConflictException;
import backend.repository.BookingRepository;
import backend.repository.CustomerRepository;
import backend.repository.RoomRepository;
import backend.repository.UserRepository;
import backend.service.impl.BookingServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class BookingServiceImplTest {

    @Mock
    private BookingRepository bookingRepository;

    @Mock
    private RoomRepository roomRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private CustomerRepository customerRepository;

    private BookingServiceImpl bookingService;

    @BeforeEach
    void setUp() {
        bookingService = new BookingServiceImpl(
                bookingRepository,
                roomRepository,
                userRepository,
                customerRepository
        );
    }

    @Test
    void returnsContinuousAvailableSlotsAroundBookings() {
        LocalDateTime from = LocalDateTime.of(2030, 1, 10, 9, 0);
        LocalDateTime to = LocalDateTime.of(2030, 1, 10, 17, 0);
        Room room = availableRoom();

        Booking first = bookingAt(
                LocalDateTime.of(2030, 1, 10, 10, 0),
                LocalDateTime.of(2030, 1, 10, 12, 0)
        );
        Booking overlapping = bookingAt(
                LocalDateTime.of(2030, 1, 10, 11, 0),
                LocalDateTime.of(2030, 1, 10, 13, 0)
        );
        Booking last = bookingAt(
                LocalDateTime.of(2030, 1, 10, 15, 0),
                LocalDateTime.of(2030, 1, 10, 16, 0)
        );

        when(roomRepository.findById(1)).thenReturn(Optional.of(room));
        when(bookingRepository.findBlockingBookings(
                eq(1),
                eq(from),
                eq(to),
                eq(BookingStatus.DA_HUY)
        )).thenReturn(List.of(first, overlapping, last));

        RoomAvailabilityResponse response = bookingService.getAvailableSlots(1, from, to);

        assertEquals(3, response.availableSlots().size());
        assertEquals(from, response.availableSlots().get(0).startTime());
        assertEquals(first.getStartTime(), response.availableSlots().get(0).endTime());
        assertEquals(overlapping.getEndTime(), response.availableSlots().get(1).startTime());
        assertEquals(last.getStartTime(), response.availableSlots().get(1).endTime());
        assertEquals(last.getEndTime(), response.availableSlots().get(2).startTime());
        assertEquals(to, response.availableSlots().get(2).endTime());
    }

    @Test
    void rejectsBookingWhenRequestedTimeOverlaps() {
        LocalDateTime startTime = LocalDateTime.now().plusDays(2).withMinute(0).withSecond(0).withNano(0);
        LocalDateTime endTime = startTime.plusHours(2);
        Room room = availableRoom();
        User account = User.builder().id(7).email("customer@example.com").build();
        Customer customer = Customer.builder().id(7).account(account).build();

        when(customerRepository.findByAccount_Email(account.getEmail())).thenReturn(Optional.of(customer));
        when(roomRepository.findByIdForUpdate(1)).thenReturn(Optional.of(room));
        when(bookingRepository.findBlockingBookings(
                eq(1),
                eq(startTime),
                eq(endTime),
                eq(BookingStatus.DA_HUY)
        )).thenReturn(List.of(bookingAt(startTime.plusMinutes(30), endTime.plusHours(1))));

        CreateBookingRequest request = new CreateBookingRequest(
                1,
                startTime,
                endTime,
                PaymentMethod.TIEN_MAT,
                null
        );

        assertThrows(
                BookingConflictException.class,
                () -> bookingService.createBooking(request, account.getEmail())
        );
        verify(bookingRepository, never()).saveAndFlush(any(Booking.class));
    }

    @Test
    void allowsBookingThatStartsWhenPreviousBookingEnds() {
        LocalDateTime startTime = LocalDateTime.now().plusDays(2).withMinute(0).withSecond(0).withNano(0);
        LocalDateTime endTime = startTime.plusHours(2);
        Room room = availableRoom();
        User account = User.builder().id(7).email("customer@example.com").build();
        Customer customer = Customer.builder().id(7).account(account).build();

        when(customerRepository.findByAccount_Email(account.getEmail())).thenReturn(Optional.of(customer));
        when(roomRepository.findByIdForUpdate(1)).thenReturn(Optional.of(room));
        when(bookingRepository.findBlockingBookings(
                eq(1),
                eq(startTime),
                eq(endTime),
                eq(BookingStatus.DA_HUY)
        )).thenReturn(List.of());
        when(bookingRepository.saveAndFlush(any(Booking.class))).thenAnswer(invocation -> {
            Booking saved = invocation.getArgument(0);
            saved.setId(99);
            return saved;
        });

        CreateBookingRequest request = new CreateBookingRequest(
                1,
                startTime,
                endTime,
                PaymentMethod.TIEN_MAT,
                null
        );

        assertEquals(
                99,
                bookingService.createBooking(request, account.getEmail()).getBookingId()
        );
    }

    private Room availableRoom() {
        RoomType roomType = RoomType.builder()
                .id(2)
                .typeName("Standard")
                .pricePerHour(new BigDecimal("150000"))
                .build();

        return Room.builder()
                .id(1)
                .roomName("Room A")
                .roomType(roomType)
                .status(RoomStatus.TRONG)
                .build();
    }

    private Booking bookingAt(LocalDateTime startTime, LocalDateTime endTime) {
        return Booking.builder()
                .startTime(startTime)
                .endTime(endTime)
                .status(BookingStatus.DA_THANH_TOAN)
                .build();
    }
}
