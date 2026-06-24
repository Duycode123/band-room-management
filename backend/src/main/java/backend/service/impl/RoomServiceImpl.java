package backend.service.impl;

import backend.dto.request.CreateRoomRequest;
import backend.dto.response.RoomResponse;
import backend.dto.response.RoomTypeResponse;
import backend.entity.Room;
import backend.entity.RoomStatus;
import backend.entity.RoomType;
import backend.entity.Role;
import backend.entity.User;
import backend.exception.ForbiddenException;
import backend.exception.ResourceNotFoundException;
import backend.repository.RoomRepository;
import backend.repository.RoomTypeRepository;
import backend.repository.UserRepository;
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
    private final UserRepository userRepository;

    @Override
    public List<RoomResponse> getRooms(Integer roomTypeId, RoomStatus status) {
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
    public RoomResponse getRoom(Integer id) {
        Room room = roomRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy phòng tập"));
        return RoomResponse.from(room);
    }

    @Override
    @Transactional
    public RoomResponse createRoom(CreateRoomRequest request, String currentUserEmail) {
        User currentUser = userRepository.findByEmail(currentUserEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy người dùng"));

        if (currentUser.getRole() != Role.ADMIN) {
            throw new ForbiddenException("Chỉ admin có quyền thêm phòng tập");
        }

        String roomName = request.getRoomName().trim();
        if (roomRepository.existsByRoomName(roomName)) {
            throw new IllegalArgumentException("Tên phòng đã tồn tại");
        }

        RoomType roomType = roomTypeRepository.findById(request.getRoomTypeId())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy loại phòng"));

        Room room = Room.builder()
                .roomName(roomName)
                .roomType(roomType)
                .status(request.getStatus() == null ? RoomStatus.TRONG : request.getStatus())
                .build();

        return RoomResponse.from(roomRepository.save(room));
    }

    @Override
    public List<RoomTypeResponse> getRoomTypes() {
        return roomTypeRepository.findAllByOrderByTypeNameAsc().stream()
                .map(RoomTypeResponse::from)
                .toList();
    }

    @Override
    public RoomTypeResponse getRoomType(Integer id) {
        return roomTypeRepository.findById(id)
                .map(RoomTypeResponse::from)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy loại phòng"));
    }
}
