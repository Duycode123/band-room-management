package backend.dto.response;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;

public record HomepageSummaryResponse(
        boolean studioOpen,
        int availableRoomsToday,
        List<RecentActivityResponse> recentActivities,
        List<NextAvailableSlotResponse> nextAvailableSlots
) {
    public record RecentActivityResponse(
            String id,
            String customerDisplayName,
            String action,
            String roomName,
            LocalDateTime createdAt
    ) {
    }

    public record NextAvailableSlotResponse(
            Integer roomId,
            String roomName,
            LocalDate date,
            LocalTime startTime,
            LocalTime endTime,
            BigDecimal pricePerHour
    ) {
    }
}
