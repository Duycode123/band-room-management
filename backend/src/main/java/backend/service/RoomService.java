package backend.service;

import backend.dto.response.RoomResponse;
import backend.dto.response.RoomTypeResponse;
import backend.entity.RoomStatus;

import java.util.List;

public interface RoomService {
    List<RoomResponse> getRooms(Long roomTypeId, RoomStatus status);

    RoomResponse getRoom(Long id);

    List<RoomTypeResponse> getRoomTypes();

    RoomTypeResponse getRoomType(Long id);
}
