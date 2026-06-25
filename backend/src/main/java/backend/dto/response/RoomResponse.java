package backend.dto.response;

import backend.entity.Room;
import backend.entity.RoomStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

import java.util.List;

@Getter
@Builder
@AllArgsConstructor
public class RoomResponse {
    private Integer id;
    private String roomName;
    private RoomTypeResponse roomType;
    private Integer floor;
    private Integer maxPeople;
    private RoomStatus status;
    private String description;
    private String imageUrl;
    private List<String> equipment;

    public static RoomResponse from(Room room) {
        return RoomResponse.builder()
                .id(room.getId())
                .roomName(room.getRoomName())
                .roomType(RoomTypeResponse.from(room.getRoomType()))
                .floor(room.getFloor())
                .maxPeople(room.getMaxPeople())
                .status(room.getStatus())
                .description(room.getDescription())
                .imageUrl(room.getImageUrl())
                .equipment(room.getEquipment() == null
                        ? List.of()
                        : room.getEquipment().stream()
                        .map(equipment -> equipment.getName())
                        .toList())
                .build();
    }
}
