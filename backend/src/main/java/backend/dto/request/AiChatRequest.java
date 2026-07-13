package backend.dto.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
public class AiChatRequest {

    @NotBlank(message = "Câu hỏi không được để trống")
    private String message;

    private LocalDateTime startTime;

    private LocalDateTime endTime;

    private Integer people;

    private BigDecimal maxPricePerHour;

    /**
     * Recent turns for continuity (client-owned). Oldest → newest, excluding the current message.
     */
    @Valid
    @Size(max = 12)
    private List<AiChatHistoryMessage> history = new ArrayList<>();

    /**
     * Room IDs already suggested in this chat — used for "phòng khác" / alternatives.
     */
    @Size(max = 50)
    private List<Integer> excludeRoomIds = new ArrayList<>();
}
