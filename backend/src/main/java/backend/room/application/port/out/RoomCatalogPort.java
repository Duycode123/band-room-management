package backend.room.application.port.out;

import backend.entity.Room;
import backend.entity.RoomStatus;
import backend.entity.RoomType;

import java.util.List;
import java.util.Optional;

public interface RoomCatalogPort {
    List<Room> loadRooms(Integer roomTypeId, RoomStatus status);

    Optional<Room> loadRoom(Integer roomId);

    Optional<Room> loadRoomForUpdate(Integer roomId);

    boolean existsRoomName(String roomName);

    boolean existsBookingForRoom(Integer roomId);

    boolean existsEquipmentForRoom(Integer roomId);

    List<RoomType> loadRoomTypes();

    Optional<RoomType> loadRoomType(Integer roomTypeId);
}
