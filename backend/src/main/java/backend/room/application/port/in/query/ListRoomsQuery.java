package backend.room.application.port.in.query;

import backend.entity.RoomStatus;

public record ListRoomsQuery(
        Integer roomTypeId,
        RoomStatus status
) {
}
