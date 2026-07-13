package backend.service.ai;

import java.util.Locale;
import java.util.Set;

/**
 * Shared guards so conversational Vietnamese ("phòng khác", "loại khác")
 * is never treated as a literal room-name lookup.
 */
public final class RoomNameIntentGuard {

    private static final Set<String> ROOM_NAME_STOPWORDS = Set.of(
            "cho", "nao", "re", "tot", "trong", "co", "voi", "theo", "duoi", "tren",
            "ban", "may", "gi", "dang", "san", "lon", "nho", "dep", "hat", "nhac",
            "karaoke", "studio", "band", "rehearsal", "thue", "dat", "xem", "het",
            "all", "moi", "cac", "nhung", "mot", "cai", "nay", "kia", "ay", "do",
            "thi", "sao", "nhi", "nhe", "di", "khong", "duoc", "phu", "hop",
            "loai", "kieu", "nhom", "to", "khach", "nguoi", "ng", "gio", "h",
            "thiet", "bi", "gia", "uu", "tien", "sang", "khac", "them", "nua",
            "yeu", "cau", "nhu", "y", "la", "tim", "tu", "van", "goi", "minh",
            "hoi", "giup", "option", "options", "other", "type", "types"
    );

    private RoomNameIntentGuard() {
    }

    public static boolean isAskingOtherRooms(String normalizedMessage) {
        if (normalizedMessage == null || normalizedMessage.isBlank()) {
            return false;
        }
        return normalizedMessage.contains("phong khac")
                || normalizedMessage.contains("loai khac")
                || normalizedMessage.contains("phong loai")
                || normalizedMessage.contains("lua chon khac")
                || normalizedMessage.contains("goi y khac")
                || normalizedMessage.contains("tu van phong khac")
                || normalizedMessage.contains("phong khac di")
                || normalizedMessage.contains("tim phong loai")
                || normalizedMessage.contains("phong kieu khac")
                || normalizedMessage.contains("con phong nao khac")
                || normalizedMessage.contains("con phong khac")
                || normalizedMessage.contains("cai khac")
                || normalizedMessage.contains("option khac");
    }

    public static String sanitizeRequestedRoomName(String rawName) {
        if (rawName == null || rawName.isBlank()) {
            return null;
        }
        String candidate = AiChatText.normalize(rawName).trim();
        if (candidate.isBlank() || !isPlausibleRoomNameToken(candidate)) {
            return null;
        }
        return candidate;
    }

    public static boolean isPlausibleRoomNameToken(String candidate) {
        if (candidate == null || candidate.isBlank()) {
            return false;
        }
        String value = candidate.trim().toLowerCase(Locale.ROOT);
        if (ROOM_NAME_STOPWORDS.contains(value) || value.matches("\\d+")) {
            return false;
        }
        return !value.matches("\\d+ng");
    }

    public static boolean isStopword(String candidate) {
        if (candidate == null || candidate.isBlank()) {
            return true;
        }
        return ROOM_NAME_STOPWORDS.contains(AiChatText.normalize(candidate));
    }
}
