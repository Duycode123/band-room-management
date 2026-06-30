package backend.room.application.port.out;

import backend.entity.Room;

public interface RoomMutationPort {
    Room saveRoom(Room room);
}
