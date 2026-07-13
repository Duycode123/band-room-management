package backend.service.ai;

import backend.dto.request.AiChatRequest;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Component
public class ChatIntentParser {

    private static final Pattern PEOPLE_PATTERN =
            Pattern.compile("(\\d{1,3})\\s*(?:nguoi|ng|khach|thanh vien|ban)\\b");
    private static final Pattern PEOPLE_SHORT_PATTERN =
            Pattern.compile("(?:cho|band|nhom|to|phu hop)\\s*(\\d{1,3})\\b");
    private static final Pattern PRICE_PATTERN =
            Pattern.compile("(?:duoi|toi da|khong qua|ngan sach|tam|khoang)?\\s*(\\d+(?:[\\.,]\\d+)?)\\s*(k|nghin|ngan|trieu|m|vnd|d|dong)\\b");
    private static final Pattern HOUR_RANGE_PATTERN =
            Pattern.compile("(\\d{1,2})(?:[:h](\\d{1,2}))?\\s*(?:h|gio)?\\s*(?:-|den|toi|~)\\s*(\\d{1,2})(?:[:h](\\d{1,2}))?\\s*(?:h|gio)?");
    private static final Pattern DURATION_PATTERN =
            Pattern.compile("(?:trong|khoang|tam)\\s*(\\d{1,2})\\s*(?:gio|tieng|h)\\b");
    private static final Pattern START_HOUR_PATTERN =
            Pattern.compile("(?:luc|tu|bat dau luc|tu luc)\\s*(\\d{1,2})(?:[:h](\\d{1,2}))?\\s*(?:h|gio)?\\b");
    private static final Pattern SINGLE_HOUR_PATTERN =
            Pattern.compile("(?:luc|tu|vao)?\\s*(\\d{1,2})(?:[:h](\\d{1,2}))?\\s*(?:h|gio)\\b");
    private static final Pattern DATE_PATTERN =
            Pattern.compile("(\\d{1,2})[/-](\\d{1,2})(?:[/-](\\d{2,4}))?");
    private static final Pattern REQUESTED_ROOM_PATTERN =
            Pattern.compile("(?:phong|room)\\s+([a-z0-9_\\-]{2,40})\\b");

    public ChatIntent parse(AiChatRequest request) {
        String originalMessage = request.getMessage().trim();
        String normalizedMessage = AiChatText.normalize(originalMessage);
        Integer people = request.getPeople() != null
                ? request.getPeople()
                : extractPeople(normalizedMessage).orElse(null);
        BigDecimal maxPrice = request.getMaxPricePerHour() != null
                ? request.getMaxPricePerHour()
                : extractMaxPrice(normalizedMessage).orElse(null);
        ChatTimeRange timeRange = resolveTimeRange(request, normalizedMessage);
        List<String> equipmentKeywords = extractEquipmentKeywords(normalizedMessage);
        String requestedRoomName = extractRequestedRoomName(normalizedMessage).orElse(null);
        String category = null;
        if (RoomNameIntentGuard.isAskingOtherRooms(normalizedMessage)) {
            requestedRoomName = null;
            category = "ROOM_SEARCH";
        } else if (requestedRoomName != null) {
            category = "ROOM_LOOKUP";
        }

        return new ChatIntent(
                originalMessage,
                normalizedMessage,
                people,
                maxPrice,
                timeRange,
                equipmentKeywords,
                requestedRoomName,
                category,
                "REGEX"
        );
    }

    private ChatTimeRange resolveTimeRange(AiChatRequest request, String normalizedMessage) {
        if (request.getStartTime() != null && request.getEndTime() != null) {
            validateTimeRange(request.getStartTime(), request.getEndTime());
            return new ChatTimeRange(request.getStartTime(), request.getEndTime());
        }

        // Avoid treating "gio mo cua" as a booking time window.
        if (isAskingOpeningHours(normalizedMessage)) {
            return null;
        }

        return extractHourRange(normalizedMessage)
                .or(() -> extractStartWithDuration(normalizedMessage))
                .or(() -> extractSingleHourWithDefaultDuration(normalizedMessage))
                .or(() -> extractSoftPeriod(normalizedMessage))
                .orElse(null);
    }

    private boolean isAskingOpeningHours(String normalizedMessage) {
        return normalizedMessage.contains("gio mo")
                || normalizedMessage.contains("mo cua")
                || normalizedMessage.contains("dong cua")
                || normalizedMessage.contains("gio hoat dong")
                || normalizedMessage.contains("hoat dong luc nao");
    }

    private Optional<ChatTimeRange> extractSoftPeriod(String normalizedMessage) {
        boolean asksAvailability = normalizedMessage.contains("con trong")
                || normalizedMessage.contains("trong khong")
                || normalizedMessage.contains("con phong")
                || normalizedMessage.contains("kiem tra lich")
                || normalizedMessage.contains("lich trong");

        LocalDate date = resolveRequestedDate(normalizedMessage, 18, 0);
        if (normalizedMessage.contains("toi nay") || normalizedMessage.contains("buoi toi")) {
            return Optional.of(new ChatTimeRange(
                    LocalDateTime.of(date, LocalTime.of(18, 0)),
                    LocalDateTime.of(date, LocalTime.of(22, 0))
            ));
        }
        if (normalizedMessage.contains("sang mai") || normalizedMessage.contains("buoi sang")) {
            LocalDate morningDate = normalizedMessage.contains("sang mai") ? LocalDate.now().plusDays(1) : date;
            return Optional.of(new ChatTimeRange(
                    LocalDateTime.of(morningDate, LocalTime.of(8, 0)),
                    LocalDateTime.of(morningDate, LocalTime.of(12, 0))
            ));
        }
        if (normalizedMessage.contains("buoi chieu") || normalizedMessage.contains("chieu nay")) {
            return Optional.of(new ChatTimeRange(
                    LocalDateTime.of(date, LocalTime.of(13, 0)),
                    LocalDateTime.of(date, LocalTime.of(17, 0))
            ));
        }
        if (asksAvailability && normalizedMessage.contains("hom nay") && !HOUR_RANGE_PATTERN.matcher(normalizedMessage).find()) {
            LocalDateTime now = LocalDateTime.now();
            LocalDateTime end = LocalDateTime.of(date, LocalTime.of(22, 0));
            if (now.isBefore(end)) {
                return Optional.of(new ChatTimeRange(now.withMinute(0).withSecond(0).withNano(0).plusHours(1), end));
            }
        }
        return Optional.empty();
    }

    private Optional<ChatTimeRange> extractSingleHourWithDefaultDuration(String normalizedMessage) {
        if (HOUR_RANGE_PATTERN.matcher(normalizedMessage).find()
                || DURATION_PATTERN.matcher(normalizedMessage).find()) {
            return Optional.empty();
        }

        Matcher matcher = SINGLE_HOUR_PATTERN.matcher(normalizedMessage);
        if (!matcher.find()) {
            return Optional.empty();
        }

        int startHour = Integer.parseInt(matcher.group(1));
        int startMinute = parseMinute(matcher.group(2));
        if (!isValidHourMinute(startHour, startMinute, false)) {
            return Optional.empty();
        }

        LocalDate date = resolveRequestedDate(normalizedMessage, startHour, startMinute);
        LocalDateTime startTime = LocalDateTime.of(date, LocalTime.of(startHour, startMinute));
        return Optional.of(new ChatTimeRange(startTime, startTime.plusHours(2)));
    }

    private Optional<ChatTimeRange> extractStartWithDuration(String normalizedMessage) {
        Matcher startMatcher = START_HOUR_PATTERN.matcher(normalizedMessage);
        Matcher durationMatcher = DURATION_PATTERN.matcher(normalizedMessage);
        if (!startMatcher.find() || !durationMatcher.find()) {
            return Optional.empty();
        }

        int startHour = Integer.parseInt(startMatcher.group(1));
        int startMinute = parseMinute(startMatcher.group(2));
        int durationHours = Integer.parseInt(durationMatcher.group(1));
        if (!isValidHourMinute(startHour, startMinute, false) || durationHours <= 0 || durationHours > 12) {
            return Optional.empty();
        }

        LocalDate date = resolveRequestedDate(normalizedMessage, startHour, startMinute);
        LocalDateTime startTime = LocalDateTime.of(date, LocalTime.of(startHour, startMinute));
        LocalDateTime endTime = startTime.plusHours(durationHours);
        return Optional.of(new ChatTimeRange(startTime, endTime));
    }

    private Optional<ChatTimeRange> extractHourRange(String normalizedMessage) {
        Matcher matcher = HOUR_RANGE_PATTERN.matcher(normalizedMessage);
        if (!matcher.find()) {
            return Optional.empty();
        }

        int startHour = Integer.parseInt(matcher.group(1));
        int startMinute = parseMinute(matcher.group(2));
        int endHour = Integer.parseInt(matcher.group(3));
        int endMinute = parseMinute(matcher.group(4));
        if (!isValidHourMinute(startHour, startMinute, false) || !isValidHourMinute(endHour, endMinute, true)) {
            return Optional.empty();
        }

        LocalDate date = resolveRequestedDate(normalizedMessage, startHour, startMinute);
        LocalTime start = LocalTime.of(startHour, startMinute);
        LocalTime end = endHour == 24 ? LocalTime.MAX : LocalTime.of(endHour, endMinute);
        if (!start.isBefore(end)) {
            return Optional.empty();
        }

        return Optional.of(new ChatTimeRange(LocalDateTime.of(date, start), LocalDateTime.of(date, end)));
    }

    private LocalDate resolveRequestedDate(String normalizedMessage, int startHour, int startMinute) {
        Optional<LocalDate> explicitDate = extractExplicitDate(normalizedMessage);
        if (explicitDate.isPresent()) {
            return explicitDate.get();
        }

        LocalDate date = LocalDate.now();
        if (normalizedMessage.contains("ngay kia") || normalizedMessage.contains("mot kia")) {
            return date.plusDays(2);
        }
        if (normalizedMessage.contains("ngay mai") || normalizedMessage.matches(".*\\bmai\\b.*")) {
            return date.plusDays(1);
        }
        if (normalizedMessage.contains("hom nay") || normalizedMessage.contains("toi nay") || normalizedMessage.contains("chieu nay")) {
            return date;
        }

        return LocalTime.of(startHour, startMinute).isBefore(LocalTime.now()) ? date.plusDays(1) : date;
    }

    private Optional<LocalDate> extractExplicitDate(String normalizedMessage) {
        Matcher matcher = DATE_PATTERN.matcher(normalizedMessage);
        if (!matcher.find()) {
            return Optional.empty();
        }

        int day = Integer.parseInt(matcher.group(1));
        int month = Integer.parseInt(matcher.group(2));
        String rawYear = matcher.group(3);
        int year = rawYear == null ? LocalDate.now().getYear() : Integer.parseInt(rawYear);
        if (year < 100) {
            year += 2000;
        }

        try {
            return Optional.of(LocalDate.of(year, month, day));
        } catch (RuntimeException exception) {
            return Optional.empty();
        }
    }

    private int parseMinute(String value) {
        return value == null || value.isBlank() ? 0 : Integer.parseInt(value);
    }

    private boolean isValidHourMinute(int hour, int minute, boolean allowTwentyFour) {
        int maxHour = allowTwentyFour ? 24 : 23;
        if (hour < 0 || hour > maxHour || minute < 0 || minute > 59) {
            return false;
        }
        return hour != 24 || minute == 0;
    }

    private Optional<Integer> extractPeople(String normalizedMessage) {
        Matcher matcher = PEOPLE_PATTERN.matcher(normalizedMessage);
        if (matcher.find()) {
            int people = Integer.parseInt(matcher.group(1));
            if (people >= 1 && people <= 50) {
                return Optional.of(people);
            }
        }

        Matcher shortMatcher = PEOPLE_SHORT_PATTERN.matcher(normalizedMessage);
        if (shortMatcher.find()) {
            int people = Integer.parseInt(shortMatcher.group(1));
            if (people >= 1 && people <= 50) {
                return Optional.of(people);
            }
        }

        return Optional.empty();
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

    private List<String> extractEquipmentKeywords(String normalizedMessage) {
        List<String> keywords = new ArrayList<>();
        if (normalizedMessage.contains("micro") || normalizedMessage.contains("mic")) {
            keywords.add("mic");
        }
        if (normalizedMessage.contains("drum")
                || normalizedMessage.contains("bo trong")
                || normalizedMessage.contains("dan trong")) {
            keywords.add("drum");
        }
        if (normalizedMessage.contains("amp") || normalizedMessage.contains("ampli")) {
            keywords.add("amp");
        }
        if (normalizedMessage.contains("mixer")) {
            keywords.add("mixer");
        }
        if (normalizedMessage.contains("guitar")) {
            keywords.add("guitar");
        }
        if (normalizedMessage.contains("keyboard") || normalizedMessage.contains("piano")) {
            keywords.add("keyboard");
        }
        return keywords;
    }

    private Optional<String> extractRequestedRoomName(String normalizedMessage) {
        if (RoomNameIntentGuard.isAskingOtherRooms(normalizedMessage)) {
            return Optional.empty();
        }

        Matcher matcher = REQUESTED_ROOM_PATTERN.matcher(normalizedMessage);
        while (matcher.find()) {
            String candidate = RoomNameIntentGuard.sanitizeRequestedRoomName(matcher.group(1));
            if (candidate != null) {
                return Optional.of(candidate);
            }
        }

        // Bare token like "ssssss" — only when message is not a generic search with people/budget.
        if (extractPeople(normalizedMessage).isPresent() || extractMaxPrice(normalizedMessage).isPresent()) {
            return Optional.empty();
        }

        String cleaned = normalizedMessage
                .replaceAll("\\b(xem|cho|toi|muon|tim|thong tin|chi tiet|ve|thi|sao|nhi|nhe|di)\\b", " ")
                .replaceAll("\\b(phong|room)\\b", " ")
                .trim()
                .replaceAll("\\s+", " ");
        String bare = RoomNameIntentGuard.sanitizeRequestedRoomName(cleaned);
        if (cleaned.matches("[a-z0-9_\\-]{3,40}") && bare != null) {
            return Optional.of(bare);
        }
        return Optional.empty();
    }

    private void validateTimeRange(LocalDateTime startTime, LocalDateTime endTime) {
        if (!startTime.isBefore(endTime)) {
            throw new IllegalArgumentException("Thời gian bắt đầu phải nhỏ hơn thời gian kết thúc");
        }
    }
}
