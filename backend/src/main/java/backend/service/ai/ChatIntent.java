package backend.service.ai;

import java.math.BigDecimal;
import java.util.List;

public record ChatIntent(
        String originalMessage,
        String normalizedMessage,
        Integer people,
        BigDecimal maxPricePerHour,
        ChatTimeRange timeRange,
        List<String> equipmentKeywords,
        String requestedRoomName,
        String category,
        String source
) {
    public boolean hasEquipmentFilter() {
        return equipmentKeywords != null && !equipmentKeywords.isEmpty();
    }

    public boolean hasRequestedRoomName() {
        return requestedRoomName != null && !requestedRoomName.isBlank();
    }

    public ChatIntent withSource(String newSource) {
        return new ChatIntent(
                originalMessage,
                normalizedMessage,
                people,
                maxPricePerHour,
                timeRange,
                equipmentKeywords,
                requestedRoomName,
                category,
                newSource
        );
    }
}
