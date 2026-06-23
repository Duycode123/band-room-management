package backend.dto.response;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class BookingCostResponse {

    private Long roomId;
    private String roomName;
    private String typeName;

    private LocalDateTime startTime;
    private LocalDateTime endTime;

    private BigDecimal totalHours;
    private BigDecimal pricePerHour;
    private BigDecimal totalAmount;
}