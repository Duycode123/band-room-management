package backend.dto.response;

import backend.entity.RoomStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;

@Getter
@Builder
@AllArgsConstructor
public class AiSuggestedRoomResponse {

    private Integer roomId;
    private String roomName;
    private String roomTypeName;
    private String roomTypeDescription;
    private BigDecimal pricePerHour;
    private Integer capacity;
    private RoomStatus status;
    private Boolean availableInRequestedTime;
    private String reason;
}
