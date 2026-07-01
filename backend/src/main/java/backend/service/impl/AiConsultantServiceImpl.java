package backend.service.impl;

import backend.dto.request.AiChatRequest;
import backend.dto.response.AiChatResponse;
import backend.dto.response.AiSuggestedRoomResponse;
import backend.entity.Booking;
import backend.entity.BookingStatus;
import backend.entity.Room;
import backend.entity.RoomStatus;
import backend.entity.RoomType;
import backend.repository.BookingRepository;
import backend.repository.RoomRepository;
import backend.service.AiConsultantService;
import backend.service.CloudflareAiClient;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
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

    private static final Logger log = LoggerFactory.getLogger(AiConsultantServiceImpl.class);

    private static final List<String> SUGGESTED_QUESTIONS = List.of(
            "Toi nay 18h den 20h con phong nao trong?",
            "Toi di 4 nguoi, phong nao phu hop?",
            "Co phong nao duoi 200k mot gio khong?",
            "Phong re nhat hien tai la phong nao?",
            "Toi muon phong rong cho nhom dong nguoi thi nen chon phong nao?",
            "Cho toi xem tat ca phong dang co",
            "Phong nao phu hop de tap band trong 2 gio?",
            "Tu van giup toi phong phu hop voi ngan sach 300k"
    );

    private static final Pattern PEOPLE_PATTERN =
            Pattern.compile("(\\d{1,3})\\s*(nguoi|khach|thanh vien|ban|member)");
    private static final Pattern PRICE_PATTERN =
            Pattern.compile("(\\d+(?:[\\.,]\\d+)?)\\s*(k|nghin|ngan|trieu|m|vnd|d|dong)");
    private static final Pattern HOUR_RANGE_PATTERN =
            Pattern.compile("(\\d{1,2})\\s*h(?:\\d{1,2})?\\s*(?:-|den|toi|~)\\s*(\\d{1,2})\\s*h");

    private final RoomRepository roomRepository;
    private final BookingRepository bookingRepository;
    private final CloudflareAiClient cloudflareAiClient;

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

        List<AiSuggestedRoomResponse> allRooms = getRoomContext(timeRange);
        List<AiSuggestedRoomResponse> matchedRooms = filterRooms(allRooms, people, maxPrice, timeRange);
        String localAnswer = buildAnswer(normalizedMessage, matchedRooms, allRooms, people, maxPrice, timeRange);
        String answer = localAnswer;
        boolean usedCloudflareAi = false;

        if (cloudflareAiClient.isConfigured()) {
            try {
                answer = cloudflareAiClient.chat(
                        buildCloudflareSystemPrompt(),
                        buildCloudflareUserPrompt(message, allRooms, matchedRooms, people, maxPrice, timeRange, localAnswer)
                );
                usedCloudflareAi = true;
            } catch (RuntimeException exception) {
                log.warn("Cloudflare AI request failed, falling back to local room rules: {}", exception.getMessage());
            }
        }

        return AiChatResponse.builder()
                .answer(answer)
                .suggestedRooms(matchedRooms)
                .interpretedStartTime(timeRange == null ? null : timeRange.startTime())
                .interpretedEndTime(timeRange == null ? null : timeRange.endTime())
                .interpretedPeople(people)
                .suggestedQuestions(getSuggestedQuestions())
                .usedAi(usedCloudflareAi)
                .mode(usedCloudflareAi ? "CLOUDFLARE_REST_API:" + cloudflareAiClient.getModel() : "LOCAL_DB_RULES")
                .build();
    }

    @Override
    public List<String> getSuggestedQuestions() {
        return SUGGESTED_QUESTIONS;
    }

    private List<AiSuggestedRoomResponse> getRoomContext(TimeRange timeRange) {
        return roomRepository.findAllByOrderByRoomNameAsc().stream()
                .map(room -> toSuggestedRoom(room, timeRange))
                .sorted(Comparator.comparing(
                                AiSuggestedRoomResponse::getPricePerHour,
                                Comparator.nullsLast(Comparator.naturalOrder()))
                        .thenComparing(AiSuggestedRoomResponse::getRoomName, Comparator.nullsLast(String::compareTo)))
                .toList();
    }

    private AiSuggestedRoomResponse toSuggestedRoom(Room room, TimeRange timeRange) {
        Boolean available = null;
        if (timeRange != null) {
            List<Booking> blockingBookings = bookingRepository.findBlockingBookings(
                    room.getId(),
                    timeRange.startTime(),
                    timeRange.endTime(),
                    BookingStatus.CANCELLED
            );
            available = blockingBookings.isEmpty();
        }

        RoomType roomType = room.getRoomType();
        AiSuggestedRoomResponse response = AiSuggestedRoomResponse.builder()
                .roomId(room.getId())
                .roomName(room.getRoomName())
                .roomTypeName(roomType == null ? "Chua co loai phong" : roomType.getTypeName())
                .roomTypeDescription(roomType == null ? null : roomType.getDescription())
                .pricePerHour(roomType == null ? null : roomType.getPricePerHour())
                .capacity(roomType == null ? null : roomType.getCapacity())
                .status(room.getStatus())
                .availableInRequestedTime(available)
                .build();

        return AiSuggestedRoomResponse.builder()
                .roomId(response.getRoomId())
                .roomName(response.getRoomName())
                .roomTypeName(response.getRoomTypeName())
                .roomTypeDescription(response.getRoomTypeDescription())
                .pricePerHour(response.getPricePerHour())
                .capacity(response.getCapacity())
                .status(response.getStatus())
                .availableInRequestedTime(response.getAvailableInRequestedTime())
                .reason(buildReason(response))
                .build();
    }

    private List<AiSuggestedRoomResponse> filterRooms(
            List<AiSuggestedRoomResponse> rooms,
            Integer people,
            BigDecimal maxPrice,
            TimeRange timeRange
    ) {
        return rooms.stream()
                .filter(room -> room.getStatus() != RoomStatus.MAINTENANCE)
                .filter(room -> people == null || room.getCapacity() != null && room.getCapacity() >= people)
                .filter(room -> maxPrice == null || room.getPricePerHour() != null && room.getPricePerHour().compareTo(maxPrice) <= 0)
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
            return "Hien he thong chua co du lieu phong. Ban thu quay lai sau hoac lien he nhan vien de duoc ho tro nhe.";
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

        StringBuilder answer = new StringBuilder("Minh tim thay ");
        answer.append(matchedRooms.size()).append(" phong phu hop");

        if (people != null) {
            answer.append(" cho khoang ").append(people).append(" nguoi");
        }
        if (maxPrice != null) {
            answer.append(", gia khong qua ").append(formatMoney(maxPrice)).append("/gio");
        }
        if (timeRange != null) {
            answer.append(", con trong tu ")
                    .append(formatTime(timeRange.startTime()))
                    .append(" den ")
                    .append(formatTime(timeRange.endTime()));
        }
        answer.append(". Ban co the tham khao: ");
        answer.append(formatRoomList(matchedRooms));
        answer.append(".");

        if (timeRange == null) {
            answer.append(" Neu ban cho minh them ngay gio muon dat, minh se kiem tra lich trong chinh xac hon nha.");
        }

        return answer.toString();
    }

    private String buildAllRoomsAnswer(List<AiSuggestedRoomResponse> rooms) {
        return "Hien he thong co cac phong sau: " + formatRoomList(rooms) + ".";
    }

    private String buildCheapestRoomAnswer(List<AiSuggestedRoomResponse> rooms) {
        List<AiSuggestedRoomResponse> activeRooms = rooms.stream()
                .filter(room -> room.getStatus() != RoomStatus.MAINTENANCE)
                .filter(room -> room.getPricePerHour() != null)
                .sorted(Comparator.comparing(AiSuggestedRoomResponse::getPricePerHour))
                .toList();

        if (activeRooms.isEmpty()) {
            return "Hien chua co phong nao san sang de tu van. Ban thu lai sau nhe.";
        }

        AiSuggestedRoomResponse cheapestRoom = activeRooms.get(0);
        return "Phong re nhat hien tai la " + cheapestRoom.getRoomName()
                + ", gia " + formatMoney(cheapestRoom.getPricePerHour()) + "/gio"
                + capacityText(cheapestRoom)
                + ".";
    }

    private String buildNoRoomAnswer(
            List<AiSuggestedRoomResponse> allRooms,
            Integer people,
            BigDecimal maxPrice,
            TimeRange timeRange
    ) {
        StringBuilder answer = new StringBuilder("Minh chua tim thay phong phu hop voi yeu cau nay.");

        if (people != null) {
            boolean hasCapacityData = allRooms.stream().anyMatch(room -> room.getCapacity() != null);
            if (!hasCapacityData) {
                answer.append(" Hien DB chua co du lieu suc chua phong, nen minh chua the tu van chinh xac theo so luong ")
                        .append(people)
                        .append(" nguoi.");
            } else {
                answer.append(" Khong co phong nao du suc chua cho ")
                        .append(people)
                        .append(" nguoi.");
            }
        }

        if (maxPrice != null) {
            answer.append(" Ban cung dang gioi han ngan sach ")
                    .append(formatMoney(maxPrice))
                    .append("/gio.");
        }

        if (timeRange != null) {
            answer.append(" Khung gio ban hoi la ")
                    .append(formatTime(timeRange.startTime()))
                    .append(" den ")
                    .append(formatTime(timeRange.endTime()))
                    .append(".");
        } else {
            answer.append(" Ban co the cho minh them ngay gio muon dat de minh kiem tra lich trong chinh xac hon nhe.");
        }

        return answer.toString();
    }

    private String formatRoomList(List<AiSuggestedRoomResponse> rooms) {
        return rooms.stream()
                .map(room -> room.getRoomName()
                        + " - " + room.getRoomTypeName()
                        + ", " + formatMoney(room.getPricePerHour()) + "/gio"
                        + capacityText(room)
                        + statusText(room))
                .reduce((first, second) -> first + "; " + second)
                .orElse("chua co phong phu hop");
    }

    private String buildReason(AiSuggestedRoomResponse room) {
        List<String> reasons = new ArrayList<>();
        reasons.add("Gia " + formatMoney(room.getPricePerHour()) + "/gio");

        if (room.getCapacity() != null) {
            reasons.add("suc chua toi da " + room.getCapacity() + " nguoi");
        } else {
            reasons.add("chua co du lieu suc chua");
        }

        if (room.getAvailableInRequestedTime() != null) {
            reasons.add(Boolean.TRUE.equals(room.getAvailableInRequestedTime())
                    ? "con trong trong khung gio yeu cau"
                    : "da co lich trong khung gio yeu cau");
        }

        return String.join(", ", reasons);
    }

    private String buildCloudflareSystemPrompt() {
        return """
                You are a Vietnamese chatbot for Band Room Management.
                Answer in friendly Vietnamese.
                Only use the room, price, capacity, status, and availability data provided by the system.
                Do not invent rooms, prices, promotions, bookings, or unavailable data.
                If date or time is missing for an availability question, ask the customer for the missing details.
                Keep the answer concise and useful for booking a music practice room.
                Avoid technical words such as API, backend, database, token, or Cloudflare in customer-facing answers.
                """;
    }

    private String buildCloudflareUserPrompt(
            String originalMessage,
            List<AiSuggestedRoomResponse> allRooms,
            List<AiSuggestedRoomResponse> matchedRooms,
            Integer people,
            BigDecimal maxPrice,
            TimeRange timeRange,
            String fallbackAnswer
    ) {
        StringBuilder prompt = new StringBuilder();
        prompt.append("Customer question:\n").append(originalMessage).append("\n\n");
        prompt.append("Interpreted filters:\n");
        prompt.append("- people: ").append(people == null ? "unknown" : people).append("\n");
        prompt.append("- max price per hour: ").append(maxPrice == null ? "unknown" : formatMoney(maxPrice)).append("\n");
        prompt.append("- requested time: ").append(timeRange == null ? "unknown" : formatTime(timeRange.startTime()) + " to " + formatTime(timeRange.endTime())).append("\n\n");
        prompt.append("Matched rooms:\n").append(formatRoomContext(matchedRooms)).append("\n\n");
        prompt.append("All rooms:\n").append(formatRoomContext(allRooms)).append("\n\n");
        prompt.append("Safe fallback answer if data is insufficient:\n").append(fallbackAnswer);
        return prompt.toString();
    }

    private String formatRoomContext(List<AiSuggestedRoomResponse> rooms) {
        if (rooms.isEmpty()) {
            return "No rooms.";
        }

        return rooms.stream()
                .map(room -> "- " + room.getRoomName()
                        + " | type: " + room.getRoomTypeName()
                        + " | price: " + formatMoney(room.getPricePerHour())
                        + "/hour | capacity: " + (room.getCapacity() == null ? "unknown" : room.getCapacity())
                        + " | status: " + room.getStatus()
                        + " | available in requested time: " + room.getAvailableInRequestedTime()
                        + " | reason: " + room.getReason())
                .reduce((first, second) -> first + "\n" + second)
                .orElse("No rooms.");
    }

    private String capacityText(AiSuggestedRoomResponse room) {
        return room.getCapacity() == null ? ", chua co du lieu suc chua" : ", toi da " + room.getCapacity() + " nguoi";
    }

    private String statusText(AiSuggestedRoomResponse room) {
        if (room.getStatus() == RoomStatus.MAINTENANCE) {
            return ", dang bao tri";
        }
        if (Boolean.TRUE.equals(room.getAvailableInRequestedTime())) {
            return ", dang trong";
        }
        if (Boolean.FALSE.equals(room.getAvailableInRequestedTime())) {
            return ", da co lich";
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
            throw new IllegalArgumentException("Thoi gian bat dau phai nho hon thoi gian ket thuc");
        }
    }

    private String normalize(String value) {
        String lowerCaseValue = value.toLowerCase();
        String normalizedValue = Normalizer.normalize(lowerCaseValue, Normalizer.Form.NFD);
        return normalizedValue.replaceAll("\\p{M}", "")
                .replace('\u0111', 'd')
                .replace('\u0110', 'D');
    }

    private String formatMoney(BigDecimal amount) {
        if (amount == null) {
            return "chua co gia";
        }
        return amount.stripTrailingZeros().toPlainString() + " VND";
    }

    private String formatTime(LocalDateTime time) {
        return time.toLocalDate() + " " + time.toLocalTime();
    }

    private record TimeRange(LocalDateTime startTime, LocalDateTime endTime) {
    }
}
