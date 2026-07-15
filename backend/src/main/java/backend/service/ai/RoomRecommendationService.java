package backend.service.ai;

import backend.dto.response.AiSuggestedRoomResponse;
import backend.entity.Booking;
import backend.entity.Room;
import backend.entity.RoomStatus;
import backend.equipment.adapter.out.persistence.EquipmentJpaEntity;
import backend.equipment.adapter.out.persistence.EquipmentRepository;
import backend.repository.BookingRepository;
import backend.repository.ReviewRepository;
import backend.repository.RoomRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class RoomRecommendationService {

    private final RoomRepository roomRepository;
    private final BookingRepository bookingRepository;
    private final ReviewRepository reviewRepository;
    private final EquipmentRepository equipmentRepository;

    public List<AiSuggestedRoomResponse> findAvailableRooms(ChatTimeRange timeRange) {
        return getRoomContext(timeRange);
    }

    public List<AiSuggestedRoomResponse> filterRooms(
            List<AiSuggestedRoomResponse> rooms,
            Integer people,
            BigDecimal maxPrice,
            ChatTimeRange timeRange,
            List<String> equipmentKeywords
    ) {
        List<String> equipmentFilter = equipmentKeywords == null ? List.of() : equipmentKeywords;

        return rooms.stream()
                .filter(room -> room.getStatus() != RoomStatus.MAINTENANCE)
                .filter(room -> people == null || room.getCapacity() != null && room.getCapacity() >= people)
                .filter(room -> maxPrice == null || room.getPricePerHour().compareTo(maxPrice) <= 0)
                .filter(room -> timeRange == null || Boolean.TRUE.equals(room.getAvailableInRequestedTime()))
                .filter(room -> equipmentFilter.isEmpty() || matchesEquipment(room, equipmentFilter))
                .sorted(Comparator
                        .comparing((AiSuggestedRoomResponse room) -> capacityDistance(room, people))
                        .thenComparing(AiSuggestedRoomResponse::getPricePerHour)
                        .thenComparing(AiSuggestedRoomResponse::getRoomName))
                .toList();
    }

    public List<AiSuggestedRoomResponse> findRoomsByName(
            List<AiSuggestedRoomResponse> rooms,
            String requestedRoomName
    ) {
        if (requestedRoomName == null || requestedRoomName.isBlank()) {
            return List.of();
        }
        String query = AiChatText.normalize(requestedRoomName);
        return rooms.stream()
                .filter(room -> {
                    String name = AiChatText.normalize(room.getRoomName());
                    if (name.equals(query)) {
                        return true;
                    }
                    if (query.length() >= 2 && name.contains(query)) {
                        return true;
                    }
                    return name.length() >= 3 && query.contains(name);
                })
                .sorted(Comparator.comparing(AiSuggestedRoomResponse::getRoomName))
                .toList();
    }

    public List<AiSuggestedRoomResponse> sortByRatingDesc(List<AiSuggestedRoomResponse> rooms) {
        return rooms.stream()
                .filter(room -> room.getStatus() != RoomStatus.MAINTENANCE)
                .sorted(Comparator
                        .comparing(
                                (AiSuggestedRoomResponse room) ->
                                        room.getAverageRating() == null ? -1D : room.getAverageRating(),
                                Comparator.reverseOrder()
                        )
                        .thenComparing(
                                (AiSuggestedRoomResponse room) ->
                                        room.getApprovedReviewCount() == null ? 0L : room.getApprovedReviewCount(),
                                Comparator.reverseOrder()
                        )
                        .thenComparing(AiSuggestedRoomResponse::getRoomName))
                .toList();
    }

    private boolean matchesEquipment(AiSuggestedRoomResponse room, List<String> equipmentFilter) {
        String haystack = AiChatText.normalize(AiChatText.blankToUnknown(room.getEquipmentSummary())
                + " "
                + AiChatText.blankToUnknown(room.getUnavailableEquipmentSummary())
                + " "
                + String.join(" ", room.getEquipmentItems() == null ? List.of() : room.getEquipmentItems()));
        return equipmentFilter.stream().allMatch(haystack::contains);
    }

    private int capacityDistance(AiSuggestedRoomResponse room, Integer people) {
        if (people == null || room.getCapacity() == null) {
            return Integer.MAX_VALUE / 4;
        }
        return Math.max(0, room.getCapacity() - people);
    }

    private List<AiSuggestedRoomResponse> getRoomContext(ChatTimeRange timeRange) {
        Map<Integer, List<EquipmentJpaEntity>> equipmentByRoom = getEquipmentByRoom();
        Map<Integer, ReviewRepository.RoomReviewStatsProjection> reviewStatsByRoom = getReviewStatsByRoom();
        Map<Integer, BookingRepository.RoomUpcomingBookingStatsProjection> bookingStatsByRoom = getBookingStatsByRoom();

        return roomRepository.findAllByOrderByRoomNameAsc().stream()
                .map(room -> toSuggestedRoom(
                        room,
                        timeRange,
                        equipmentByRoom.getOrDefault(room.getId(), List.of()),
                        reviewStatsByRoom.get(room.getId()),
                        bookingStatsByRoom.get(room.getId())
                ))
                .sorted(Comparator.comparing(AiSuggestedRoomResponse::getPricePerHour)
                        .thenComparing(AiSuggestedRoomResponse::getRoomName))
                .toList();
    }

    private Map<Integer, List<EquipmentJpaEntity>> getEquipmentByRoom() {
        // Prefer findAllWithRoom: search(null,...) hits PostgreSQL named-enum null typing bugs.
        return equipmentRepository.findAllWithRoom().stream()
                .collect(Collectors.groupingBy(equipment -> equipment.getRoom().getId()));
    }

    private Map<Integer, ReviewRepository.RoomReviewStatsProjection> getReviewStatsByRoom() {
        return reviewRepository.findApprovedRoomReviewStats().stream()
                .collect(Collectors.toMap(
                        ReviewRepository.RoomReviewStatsProjection::getRoomId,
                        stats -> stats
                ));
    }

    private Map<Integer, BookingRepository.RoomUpcomingBookingStatsProjection> getBookingStatsByRoom() {
        LocalDateTime now = LocalDateTime.now();
        return bookingRepository.findUpcomingRoomBookingStats(now, now.plusDays(14))
                .stream()
                .collect(Collectors.toMap(
                        BookingRepository.RoomUpcomingBookingStatsProjection::getRoomId,
                        stats -> stats
                ));
    }

    private AiSuggestedRoomResponse toSuggestedRoom(
            Room room,
            ChatTimeRange timeRange,
            List<EquipmentJpaEntity> equipment,
            ReviewRepository.RoomReviewStatsProjection reviewStats,
            BookingRepository.RoomUpcomingBookingStatsProjection bookingStats
    ) {
        Boolean available = null;
        if (timeRange != null) {
            List<Booking> blockingBookings = bookingRepository.findBlockingBookings(
                    room.getId(),
                    timeRange.startTime(),
                    timeRange.endTime()
            );
            available = blockingBookings.isEmpty();
        }

        return AiSuggestedRoomResponse.builder()
                .roomId(room.getId())
                .roomName(room.getRoomName())
                .roomTypeName(room.getRoomType().getTypeName())
                .roomTypeDescription(room.getRoomType().getDescription())
                .pricePerHour(room.getRoomType().getPricePerHour())
                .capacity(room.getMaxPeople())
                .status(room.getStatus())
                .imageUrl(room.getImageUrl())
                .averageRating(reviewStats == null ? null : reviewStats.getAverageRating())
                .approvedReviewCount(reviewStats == null ? 0L : reviewStats.getReviewCount())
                .upcomingBookingCount(bookingStats == null ? 0L : bookingStats.getUpcomingBookingCount())
                .nextBookedStartTime(bookingStats == null || bookingStats.getNextStartTime() == null
                        ? null
                        : AiChatText.formatTime(bookingStats.getNextStartTime()))
                .equipmentSummary(buildEquipmentSummary(equipment, false))
                .unavailableEquipmentSummary(buildEquipmentSummary(equipment, true))
                .equipmentItems(buildEquipmentItems(equipment))
                .availableInRequestedTime(available)
                .reason(buildReason(room, available, equipment))
                .build();
    }

    private List<String> buildEquipmentItems(List<EquipmentJpaEntity> equipment) {
        return equipment.stream()
                .sorted(Comparator.comparing((EquipmentJpaEntity item) -> item.getType().name())
                        .thenComparing(EquipmentJpaEntity::getName))
                .map(this::formatEquipment)
                .toList();
    }

    private String buildEquipmentSummary(List<EquipmentJpaEntity> equipment, boolean unavailableOnly) {
        if (equipment.isEmpty()) {
            return unavailableOnly ? "" : "chua co du lieu thiet bi";
        }

        List<String> items = equipment.stream()
                .filter(item -> unavailableOnly
                        ? !"GOOD".equals(item.getStatus().name())
                        : "GOOD".equals(item.getStatus().name()))
                .sorted(Comparator.comparing((EquipmentJpaEntity item) -> item.getType().name())
                        .thenComparing(EquipmentJpaEntity::getName))
                .map(item -> item.getType() + " - " + item.getName())
                .toList();

        if (items.isEmpty()) {
            return unavailableOnly ? "" : "chua co thiet bi san sang";
        }
        return String.join("; ", items);
    }

    private String formatEquipment(EquipmentJpaEntity equipment) {
        StringBuilder text = new StringBuilder()
                .append(equipment.getType())
                .append(" - ")
                .append(equipment.getName())
                .append(" (")
                .append(equipment.getStatus())
                .append(")");
        if (equipment.getNotes() != null && !equipment.getNotes().isBlank()) {
            text.append(": ").append(equipment.getNotes());
        }
        return text.toString();
    }

    private String buildReason(Room room, Boolean available, List<EquipmentJpaEntity> equipment) {
        List<String> reasons = new ArrayList<>();
        reasons.add("Giá " + AiChatText.formatMoney(room.getRoomType().getPricePerHour()) + "/giờ");

        if (room.getMaxPeople() != null) {
            reasons.add("sức chứa tối đa " + room.getMaxPeople() + " người");
        } else {
            reasons.add("chưa có dữ liệu sức chứa");
        }

        if (available != null) {
            reasons.add(available ? "còn trống trong khung giờ yêu cầu" : "đã có lịch trong khung giờ yêu cầu");
        }

        String equipmentSummary = buildEquipmentSummary(equipment, false);
        if (!equipmentSummary.isBlank()) {
            reasons.add("thiet bi san sang: " + equipmentSummary);
        }

        return String.join(", ", reasons);
    }
}
