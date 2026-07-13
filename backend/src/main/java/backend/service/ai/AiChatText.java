package backend.service.ai;

import backend.dto.response.AiSuggestedRoomResponse;
import backend.entity.RoomStatus;

import java.math.BigDecimal;
import java.text.Normalizer;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

public final class AiChatText {

    private static final DateTimeFormatter PROMPT_TIME_FORMATTER =
            DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");

    private AiChatText() {
    }

    public static String normalize(String value) {
        String lowerCaseValue = value.toLowerCase();
        String normalizedValue = Normalizer.normalize(lowerCaseValue, Normalizer.Form.NFD);
        return normalizedValue.replaceAll("\\p{M}", "").replace('đ', 'd');
    }

    public static String blankToUnknown(String value) {
        return value == null || value.isBlank() ? "unknown" : value;
    }

    public static String formatMoney(BigDecimal amount) {
        return amount.stripTrailingZeros().toPlainString() + "đ";
    }

    public static String formatTime(LocalDateTime time) {
        return time.format(PROMPT_TIME_FORMATTER);
    }

    public static String formatRating(AiSuggestedRoomResponse room) {
        if (room.getAverageRating() == null || room.getApprovedReviewCount() == null || room.getApprovedReviewCount() == 0) {
            return "chua co review da duyet";
        }
        return String.format("%.1f/5 (%d review)", room.getAverageRating(), room.getApprovedReviewCount());
    }

    public static String capacityText(AiSuggestedRoomResponse room) {
        return room.getCapacity() == null
                ? ", chưa có dữ liệu sức chứa"
                : ", tối đa " + room.getCapacity() + " người";
    }

    public static String statusText(AiSuggestedRoomResponse room) {
        if (room.getStatus() == RoomStatus.MAINTENANCE) {
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

    public static boolean isLikelyIncompleteAnswer(String answer) {
        if (answer == null || answer.isBlank()) {
            return true;
        }

        String trimmed = answer.trim();
        if (trimmed.matches(".*[.!?]$")) {
            return false;
        }

        String normalized = normalize(trimmed).trim();
        return trimmed.endsWith(",")
                || trimmed.endsWith(":")
                || trimmed.endsWith(";")
                || trimmed.endsWith("-")
                || normalized.matches(".*\\b(co the|la|gom|nhu|voi|va|hoac|tu|den|de|cho|ban|phong|mot so|tham khao)$");
    }
}
