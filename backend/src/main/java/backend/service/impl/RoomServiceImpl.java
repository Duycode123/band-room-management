package backend.service.impl;

import backend.dto.response.RoomResponse;
import backend.dto.response.RoomTypeResponse;
import backend.entity.Room;
import backend.entity.RoomStatus;
import backend.exception.ResourceNotFoundException;
import backend.repository.RoomRepository;
import backend.repository.RoomTypeRepository;
import backend.service.RoomService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class RoomServiceImpl implements RoomService {

    private final RoomRepository roomRepository;
    private final RoomTypeRepository roomTypeRepository;

    @Override
    public List<RoomResponse> getRooms(Long roomTypeId, RoomStatus status) {
        List<Room> rooms;

        if (roomTypeId != null && status != null) {
            rooms = roomRepository.findByRoomType_IdAndStatusOrderByRoomNameAsc(roomTypeId, status);
        } else if (roomTypeId != null) {
            rooms = roomRepository.findByRoomType_IdOrderByRoomNameAsc(roomTypeId);
        } else if (status != null) {
            rooms = roomRepository.findByStatusOrderByRoomNameAsc(status);
        } else {
            rooms = roomRepository.findAllByOrderByRoomNameAsc();
        }

        return rooms.stream().map(RoomResponse::from).toList();
    }

    @Override
    public RoomResponse getRoom(Long id) {
        Room room = roomRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy phòng tập"));
        return RoomResponse.from(room);
    }

    @Override
    public List<RoomTypeResponse> getRoomTypes() {
        return roomTypeRepository.findAllByOrderByTypeNameAsc().stream()
                .map(RoomTypeResponse::from)
                .toList();
    }

    @Override
    public RoomTypeResponse getRoomType(Long id) {
        return roomTypeRepository.findById(id)
                .map(RoomTypeResponse::from)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy loại phòng"));
    }
}
