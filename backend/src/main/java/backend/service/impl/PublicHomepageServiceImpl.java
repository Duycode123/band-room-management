package backend.service.impl;

import backend.dto.response.HomepageSummaryResponse;
import backend.entity.Booking;
import backend.entity.BookingStatus;
import backend.entity.Customer;
import backend.entity.PaymentTransaction;
import backend.entity.PaymentTransactionStatus;
import backend.entity.Room;
import backend.entity.RoomStatus;
import backend.repository.BookingRepository;
import backend.repository.PaymentTransactionRepository;
import backend.repository.RoomRepository;
import backend.service.PublicHomepageService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Objects;

@Service
@RequiredArgsConstructor
public class PublicHomepageServiceImpl implements PublicHomepageService {

    private static final LocalTime OPEN_TIME = LocalTime.of(9, 0);
    private static final LocalTime CLOSE_TIME = LocalTime.of(23, 0);

    private final RoomRepository roomRepository;
    private final BookingRepository bookingRepository;
    private final PaymentTransactionRepository paymentTransactionRepository;

    @Override
    @Transactional(readOnly = true)
    public HomepageSummaryResponse getSummary() {
        LocalDateTime now = LocalDateTime.now();
        LocalDate today = now.toLocalDate();
        List<Room> rooms = roomRepository.findAllByOrderByRoomNameAsc().stream()
                .filter(room -> room.getStatus() != RoomStatus.BAO_TRI)
                .toList();

        return new HomepageSummaryResponse(
                isStudioOpen(now.toLocalTime()),
                countRoomsWithAvailableSlot(rooms, today, now.toLocalTime()),
                getRecentActivities(),
                getNextAvailableSlots(rooms, now)
        );
    }

    private boolean isStudioOpen(LocalTime time) {
        return !time.isBefore(OPEN_TIME) && time.isBefore(CLOSE_TIME);
    }

    private int countRoomsWithAvailableSlot(List<Room> rooms, LocalDate date, LocalTime currentTime) {
        return (int) rooms.stream()
                .filter(room -> findFirstSlotForRoom(room, date, currentTime) != null)
                .count();
    }

    private List<HomepageSummaryResponse.RecentActivityResponse> getRecentActivities() {
        List<HomepageSummaryResponse.RecentActivityResponse> activities = new ArrayList<>();

        bookingRepository.findTop5ByOrderByCreatedAtDesc().stream()
                .filter(booking -> booking.getCreatedAt() != null)
                .map(booking -> toBookingActivity(booking, booking.getStatus() == BookingStatus.DA_HUY ? "CANCELLED" : "BOOKED"))
                .forEach(activities::add);

        paymentTransactionRepository.findTop5ByStatusOrderByPaidAtDesc(PaymentTransactionStatus.THANH_CONG).stream()
                .filter(transaction -> transaction.getBooking() != null)
                .filter(transaction -> transaction.getPaidAt() != null)
                .map(transaction -> toPaymentActivity(transaction, "PAID"))
                .filter(Objects::nonNull)
                .forEach(activities::add);

        return activities.stream()
                .sorted(Comparator.comparing(HomepageSummaryResponse.RecentActivityResponse::createdAt).reversed())
                .limit(3)
                .toList();
    }

    private HomepageSummaryResponse.RecentActivityResponse toBookingActivity(Booking booking, String action) {
        return new HomepageSummaryResponse.RecentActivityResponse(
                "booking_%s".formatted(booking.getId()),
                maskCustomerName(booking.getCustomer()),
                action,
                getRoomName(booking.getRoom()),
                booking.getCreatedAt()
        );
    }

    private HomepageSummaryResponse.RecentActivityResponse toPaymentActivity(PaymentTransaction transaction, String action) {
        Booking booking = transaction.getBooking();
        if (booking == null) {
            return null;
        }

        return new HomepageSummaryResponse.RecentActivityResponse(
                "payment_%s".formatted(transaction.getId()),
                maskCustomerName(booking.getCustomer()),
                action,
                getRoomName(booking.getRoom()),
                transaction.getPaidAt()
        );
    }

    private List<HomepageSummaryResponse.NextAvailableSlotResponse> getNextAvailableSlots(List<Room> rooms, LocalDateTime now) {
        for (int dayOffset = 0; dayOffset <= 1; dayOffset++) {
            LocalDate date = now.toLocalDate().plusDays(dayOffset);
            LocalTime startFrom = dayOffset == 0 ? now.toLocalTime() : OPEN_TIME;

            for (Room room : rooms) {
                LocalTime slotStart = findFirstSlotForRoom(room, date, startFrom);
                if (slotStart != null) {
                    LocalTime slotEnd = slotStart.plusHours(1);
                    return List.of(new HomepageSummaryResponse.NextAvailableSlotResponse(
                            room.getId(),
                            getRoomName(room),
                            date,
                            slotStart,
                            slotEnd,
                            room.getRoomType().getPricePerHour()
                    ));
                }
            }
        }

        return List.of();
    }

    private LocalTime findFirstSlotForRoom(Room room, LocalDate date, LocalTime startFrom) {
        LocalTime slotStart = roundUpToNextHour(startFrom);
        if (slotStart.isBefore(OPEN_TIME)) {
            slotStart = OPEN_TIME;
        }

        while (slotStart.plusHours(1).compareTo(CLOSE_TIME) <= 0) {
            LocalDateTime startDateTime = LocalDateTime.of(date, slotStart);
            LocalDateTime endDateTime = startDateTime.plusHours(1);
            boolean blocked = !bookingRepository.findBlockingBookings(
                    room.getId(),
                    startDateTime,
                    endDateTime,
                    BookingStatus.DA_HUY
            ).isEmpty();

            if (!blocked) {
                return slotStart;
            }

            slotStart = slotStart.plusHours(1);
        }

        return null;
    }

    private LocalTime roundUpToNextHour(LocalTime time) {
        if (time.getMinute() == 0 && time.getSecond() == 0 && time.getNano() == 0) {
            return time.withSecond(0).withNano(0);
        }

        return time.plusHours(1).withMinute(0).withSecond(0).withNano(0);
    }

    private String getRoomName(Room room) {
        return room == null || room.getRoomName() == null ? "Phòng tập" : room.getRoomName();
    }

    private String maskCustomerName(Customer customer) {
        if (customer == null || customer.getFullName() == null || customer.getFullName().isBlank()) {
            return "Một khách hàng";
        }

        String fullName = customer.getFullName().trim();
        if (fullName.toLowerCase().startsWith("the ")) {
            return fullName;
        }

        String[] parts = fullName.split("\\s+");
        if (parts.length == 1) {
            return parts[0];
        }

        return "%s %s.".formatted(parts[0], parts[parts.length - 1].substring(0, 1).toUpperCase());
    }
}
