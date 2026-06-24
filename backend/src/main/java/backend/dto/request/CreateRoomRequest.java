package backend.dto.request;

import backend.entity.RoomStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class CreateRoomRequest {

    @NotBlank(message = "Tên phòng không được để trống")
    private String roomName;

    @NotNull(message = "roomTypeId không được để trống")
    private Integer roomTypeId;

    private RoomStatus status;
}
