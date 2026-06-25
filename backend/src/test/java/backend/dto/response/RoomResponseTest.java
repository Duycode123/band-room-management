package backend.dto.response;

import backend.entity.Equipment;
import backend.entity.Room;
import backend.entity.RoomStatus;
import backend.entity.RoomType;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;

class RoomResponseTest {

    @Test
    void mapsEquipmentNamesFromRoomEntity() {
        RoomType roomType = RoomType.builder()
                .id(2)
                .typeName("Standard")
                .pricePerHour(new BigDecimal("150000"))
                .build();

        Room room = Room.builder()
                .id(1)
                .roomName("Room A")
                .roomType(roomType)
                .status(RoomStatus.TRONG)
                .equipment(List.of(
                        Equipment.builder().id(1).name("Amp guitar").build(),
                        Equipment.builder().id(2).name("Mic vocal").build()
                ))
                .build();

        RoomResponse response = RoomResponse.from(room);

        assertEquals(List.of("Amp guitar", "Mic vocal"), response.getEquipment());
    }
}
