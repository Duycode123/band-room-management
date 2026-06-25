package backend.service.impl;

import backend.dto.request.AiChatRequest;
import backend.dto.response.AiChatResponse;
import backend.dto.response.AiSuggestedRoomResponse;
import backend.entity.Booking;
import backend.entity.BookingStatus;
import backend.entity.Room;
import backend.entity.RoomStatus;
import backend.repository.BookingRepository;
import backend.repository.RoomRepository;
import backend.service.AiConsultantService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.text.Normalizer;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
public class AiConsultantServiceImpl implements AiConsultantService {

    private static final List<String> SUGGESTED_QUESTIONS = List.of(
            "Tối nay 18h đến 20h còn phòng nào trống?",
            "Tôi đi 4 người, phòng nào phù hợp?",
            "Có phòng nào dưới 200k một giờ không?",
            "Phòng rẻ nhất hiện tại là phòng nào?",
            "Tôi muốn phòng rộng cho nhóm đông người thì nên chọn phòng nào?",
            "Cho tôi xem tất cả phòng đang có",
            "Phòng nào phù hợp để tập band trong 2 giờ?",
            "Tư vấn giúp tôi phòng phù hợp với ngân sách 300k"
    );

    private static final Pattern PEOPLE_PATTERN =
            Pattern.compile("(\\d{1,3})\\s*(nguoi|khach|thanh vien|ban)");
    private static final Pattern PRICE_PATTERN =
            Pattern.compile("(\\d+(?:[\\.,]\\d+)?)\\s*(k|nghin|ngan|trieu|m|vnd|d|dong)");
    private static final Pattern HOUR_RANGE_PATTERN =
            Pattern.compile("(\\d{1,2})\\s*h(?:\\d{1,2})?\\s*(?:-|den|toi|~)\\s*(\\d{1,2})\\s*h");

    private final RoomRepository roomRepository;
    private final BookingRepository bookingRepository;

    @Override
    @Transactional(readOnly = true)
    public AiChatResponse chat(AiChatRequest request) {
        String message = request.getMessage().trim();
        String normalizedMessage = normalize(message);
        Integer people = request.getPeople() != null
                ? request.getPeople()
                : extractPeople(normalizedMessage).orElse(null);
        BigDecimal maxPrice = request.getMaxPricePerHour() != null
                ? request.getMaxPricePerHour()
                : extractMaxPrice(normalizedMessage).orElse(null);
        TimeRange timeRange = resolveTimeRange(request, normalizedMessage);

        List<AiSuggestedRoomResponse> allAvailableRooms = getRoomContext(timeRange);
        List<AiSuggestedRoomResponse> matchedRooms = filterRooms(allAvailableRooms, people, maxPrice, timeRange);
        String answer = buildAnswer(normalizedMessage, matchedRooms, allAvailableRooms, people, maxPrice, timeRange);

        return AiChatResponse.builder()
                .answer(answer)
                .suggestedRooms(matchedRooms)
                .interpretedStartTime(timeRange == null ? null : timeRange.startTime())
                .interpretedEndTime(timeRange == null ? null : timeRange.endTime())
                .interpretedPeople(people)
                .suggestedQuestions(getSuggestedQuestions())
                .usedAi(true)
                .mode("LOCAL_DB_RULES")
                .build();
    }

    @Override
    public List<String> getSuggestedQuestions() {
        return SUGGESTED_QUESTIONS;
    }

    private List<AiSuggestedRoomResponse> getRoomContext(TimeRange timeRange) {
        return roomRepository.findAllByOrderByRoomNameAsc().stream()
                .map(room -> toSuggestedRoom(room, timeRange))
                .sorted(Comparator.comparing(AiSuggestedRoomResponse::getPricePerHour)
                        .thenComparing(AiSuggestedRoomResponse::getRoomName))
                .toList();
    }

    private AiSuggestedRoomResponse toSuggestedRoom(Room room, TimeRange timeRange) {
        Boolean available = null;
        if (timeRange != null) {
            List<Booking> blockingBookings = bookingRepository.findBlockingBookings(
                    room.getId(),
                    timeRange.startTime(),
                    timeRange.endTime(),
                    BookingStatus.DA_HUY
            );
            available = blockingBookings.isEmpty();
        }

        return AiSuggestedRoomResponse.builder()
                .roomId(room.getId())
                .roomName(room.getRoomName())
                .roomTypeName(room.getRoomType().getTypeName())
                .roomTypeDescription(room.getRoomType().getDescription())
                .pricePerHour(room.getRoomType().getPricePerHour())
                .capacity(room.getRoomType().getCapacity())
                .status(room.getStatus())
                .availableInRequestedTime(available)
                .reason(buildReason(room, available))
                .build();
    }

    private List<AiSuggestedRoomResponse> filterRooms(
            List<AiSuggestedRoomResponse> rooms,
            Integer people,
            BigDecimal maxPrice,
            TimeRange timeRange
    ) {
        return rooms.stream()
                .filter(room -> room.getStatus() != RoomStatus.BAO_TRI)
                .filter(room -> people == null || room.getCapacity() != null && room.getCapacity() >= people)
                .filter(room -> maxPrice == null || room.getPricePerHour().compareTo(maxPrice) <= 0)
                .filter(room -> timeRange == null || Boolean.TRUE.equals(room.getAvailableInRequestedTime()))
                .toList();
    }

    private String buildAnswer(
            String normalizedMessage,
            List<AiSuggestedRoomResponse> matchedRooms,
            List<AiSuggestedRoomResponse> allRooms,
            Integer people,
            BigDecimal maxPrice,
            TimeRange timeRange
    ) {
        if (allRooms.isEmpty()) {
            return "Hiện hệ thống chưa có dữ liệu phòng. Bạn thử quay lại sau hoặc liên hệ nhân viên để được hỗ trợ nhé.";
        }

        if (isAskingAllRooms(normalizedMessage)) {
            return buildAllRoomsAnswer(allRooms);
        }

        if (isAskingCheapestRoom(normalizedMessage)) {
            return buildCheapestRoomAnswer(matchedRooms.isEmpty() ? allRooms : matchedRooms);
        }

        if (matchedRooms.isEmpty()) {
            return buildNoRoomAnswer(allRooms, people, maxPrice, timeRange);
        }

        StringBuilder answer = new StringBuilder("Mình tìm thấy ");
        answer.append(matchedRooms.size()).append(" phòng phù hợp");

        if (people != null) {
            answer.append(" cho khoảng ").append(people).append(" người");
        }
        if (maxPrice != null) {
            answer.append(", giá không quá ").append(formatMoney(maxPrice)).append("/giờ");
        }
        if (timeRange != null) {
            answer.append(", còn trống từ ")
                    .append(formatTime(timeRange.startTime()))
                    .append(" đến ")
                    .append(formatTime(timeRange.endTime()));
        }
        answer.append(". ");

        answer.append("Bạn có thể tham khảo: ");
        answer.append(formatRoomList(matchedRooms));
        answer.append(".");

        if (timeRange == null) {
            answer.append(" Nếu bạn cho mình thêm ngày giờ muốn đặt, mình sẽ kiểm tra lịch trống chính xác hơn nha.");
        }

        return answer.toString();
    }

    private String buildAllRoomsAnswer(List<AiSuggestedRoomResponse> rooms) {
        return "Hiện hệ thống có các phòng sau: " + formatRoomList(rooms) + ".";
    }

    private String buildCheapestRoomAnswer(List<AiSuggestedRoomResponse> rooms) {
        List<AiSuggestedRoomResponse> activeRooms = rooms.stream()
                .filter(room -> room.getStatus() != RoomStatus.BAO_TRI)
                .sorted(Comparator.comparing(AiSuggestedRoomResponse::getPricePerHour))
                .toList();

        if (activeRooms.isEmpty()) {
            return "Hiện chưa có phòng nào sẵn sàng để tư vấn. Bạn thử lại sau nhé.";
        }

        AiSuggestedRoomResponse cheapestRoom = activeRooms.get(0);
        return "Phòng rẻ nhất hiện tại là " + cheapestRoom.getRoomName()
                + ", giá " + formatMoney(cheapestRoom.getPricePerHour()) + "/giờ"
                + capacityText(cheapestRoom)
                + ".";
    }

    private String buildNoRoomAnswer(
            List<AiSuggestedRoomResponse> allRooms,
            Integer people,
            BigDecimal maxPrice,
            TimeRange timeRange
    ) {
        StringBuilder answer = new StringBuilder("Mình chưa tìm thấy phòng phù hợp với yêu cầu này.");

        if (people != null) {
            boolean hasCapacityData = allRooms.stream().anyMatch(room -> room.getCapacity() != null);
            if (!hasCapacityData) {
                answer.append(" Hiện DB chưa có dữ liệu sức chứa phòng, nên mình không thể tư vấn chính xác theo số lượng ")
                        .append(people)
                        .append(" người.");
            } else {
                answer.append(" Không có phòng nào đủ sức chứa cho ")
                        .append(people)
                        .append(" người.");
            }
        }

        if (maxPrice != null) {
            answer.append(" Bạn cũng đang giới hạn ngân sách ")
                    .append(formatMoney(maxPrice))
                    .append("/giờ.");
        }

        if (timeRange != null) {
            answer.append(" Khung giờ bạn hỏi là ")
                    .append(formatTime(timeRange.startTime()))
                    .append(" đến ")
                    .append(formatTime(timeRange.endTime()))
                    .append(".");
        } else {
            answer.append(" Bạn có thể cho mình thêm ngày giờ muốn đặt để mình kiểm tra lịch trống chính xác hơn nhé.");
        }

        return answer.toString();
    }

    private String formatRoomList(List<AiSuggestedRoomResponse> rooms) {
        return rooms.stream()
                .map(room -> room.getRoomName()
                        + " - " + room.getRoomTypeName()
                        + ", " + formatMoney(room.getPricePerHour()) + "/giờ"
                        + capacityText(room)
                        + statusText(room))
                .reduce((first, second) -> first + "; " + second)
                .orElse("chưa có phòng phù hợp");
    }

    private String buildReason(Room room, Boolean available) {
        List<String> reasons = new ArrayList<>();
        reasons.add("Giá " + formatMoney(room.getRoomType().getPricePerHour()) + "/giờ");

        if (room.getRoomType().getCapacity() != null) {
            reasons.add("sức chứa tối đa " + room.getRoomType().getCapacity() + " người");
        } else {
            reasons.add("chưa có dữ liệu sức chứa");
        }

        if (available != null) {
            reasons.add(available ? "còn trống trong khung giờ yêu cầu" : "đã có lịch trong khung giờ yêu cầu");
        }

        return String.join(", ", reasons);
    }

    private String capacityText(AiSuggestedRoomResponse room) {
        return room.getCapacity() == null ? ", chưa có dữ liệu sức chứa" : ", tối đa " + room.getCapacity() + " người";
    }

    private String statusText(AiSuggestedRoomResponse room) {
        if (room.getStatus() == RoomStatus.BAO_TRI) {
            return ", đang bảo trì";
        }
        if (Boolean.TRUE.equals(room.getAvailableInRequestedTime())) {
            return ", đang trống";
        }
        if (Boolean.FALSE.equals(room.getAvailableInRequestedTime())) {
            return ", đã có lịch";
        }
        return "";
    }

    private boolean isAskingAllRooms(String normalizedMessage) {
        return normalizedMessage.contains("tat ca phong")
                || normalizedMessage.contains("danh sach phong")
                || normalizedMessage.contains("co nhung phong nao")
                || normalizedMessage.contains("xem phong");
    }

    private boolean isAskingCheapestRoom(String normalizedMessage) {
        return normalizedMessage.contains("re nhat")
                || normalizedMessage.contains("gia thap nhat")
                || normalizedMessage.contains("phong re");
    }

    private TimeRange resolveTimeRange(AiChatRequest request, String normalizedMessage) {
        if (request.getStartTime() != null && request.getEndTime() != null) {
            validateTimeRange(request.getStartTime(), request.getEndTime());
            return new TimeRange(request.getStartTime(), request.getEndTime());
        }

        return extractHourRange(normalizedMessage).orElse(null);
    }

    private Optional<TimeRange> extractHourRange(String normalizedMessage) {
        Matcher matcher = HOUR_RANGE_PATTERN.matcher(normalizedMessage);
        if (!matcher.find()) {
            return Optional.empty();
        }

        int startHour = Integer.parseInt(matcher.group(1));
        int endHour = Integer.parseInt(matcher.group(2));
        if (startHour < 0 || startHour > 23 || endHour < 1 || endHour > 24 || startHour >= endHour) {
            return Optional.empty();
        }

        LocalDate date = LocalDate.now();
        if (normalizedMessage.contains("ngay mai") || normalizedMessage.contains("mai")) {
            date = date.plusDays(1);
        } else if (!normalizedMessage.contains("nay") && LocalTime.of(startHour, 0).isBefore(LocalTime.now())) {
            date = date.plusDays(1);
        }

        LocalDateTime startTime = LocalDateTime.of(date, LocalTime.of(startHour, 0));
        LocalDateTime endTime = LocalDateTime.of(date, endHour == 24 ? LocalTime.MAX : LocalTime.of(endHour, 0));

        return Optional.of(new TimeRange(startTime, endTime));
    }

    private Optional<Integer> extractPeople(String normalizedMessage) {
        Matcher matcher = PEOPLE_PATTERN.matcher(normalizedMessage);
        if (!matcher.find()) {
            return Optional.empty();
        }

        return Optional.of(Integer.parseInt(matcher.group(1)));
    }

    private Optional<BigDecimal> extractMaxPrice(String normalizedMessage) {
        Matcher matcher = PRICE_PATTERN.matcher(normalizedMessage);
        while (matcher.find()) {
            BigDecimal value = new BigDecimal(matcher.group(1).replace(',', '.'));
            String unit = matcher.group(2);
            if (unit.equals("k") || unit.equals("nghin") || unit.equals("ngan")) {
                return Optional.of(value.multiply(BigDecimal.valueOf(1000)));
            }
            if (unit.equals("trieu") || unit.equals("m")) {
                return Optional.of(value.multiply(BigDecimal.valueOf(1_000_000)));
            }
            return Optional.of(value);
        }

        return Optional.empty();
    }

    private void validateTimeRange(LocalDateTime startTime, LocalDateTime endTime) {
        if (!startTime.isBefore(endTime)) {
            throw new IllegalArgumentException("Thời gian bắt đầu phải nhỏ hơn thời gian kết thúc");
        }
    }

    private String normalize(String value) {
        String lowerCaseValue = value.toLowerCase();
        String normalizedValue = Normalizer.normalize(lowerCaseValue, Normalizer.Form.NFD);
        return normalizedValue.replaceAll("\\p{M}", "").replace('đ', 'd');
    }

    private String formatMoney(BigDecimal amount) {
        return amount.stripTrailingZeros().toPlainString() + "đ";
    }

    private String formatTime(LocalDateTime time) {
        return time.toLocalDate() + " " + time.toLocalTime();
    }

    private record TimeRange(LocalDateTime startTime, LocalDateTime endTime) {
    }
}
