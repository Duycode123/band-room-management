package backend.service.ai;

import java.time.LocalDateTime;

public record ChatTimeRange(LocalDateTime startTime, LocalDateTime endTime) {
}
