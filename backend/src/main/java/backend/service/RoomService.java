package backend.service;

import backend.dto.request.CreateRoomRequest;
import backend.dto.response.RoomResponse;
import backend.dto.response.RoomTypeResponse;
import backend.entity.RoomStatus;

import java.util.List;

public interface RoomService {
    List<RoomResponse> getRooms(Integer roomTypeId, RoomStatus status);

    RoomResponse getRoom(Integer id);

    RoomResponse createRoom(CreateRoomRequest request, String currentUserEmail);

    List<RoomTypeResponse> getRoomTypes();

    RoomTypeResponse getRoomType(Integer id);
}
