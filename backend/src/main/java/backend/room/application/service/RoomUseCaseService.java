package backend.room.application.service;

import backend.dto.response.RoomResponse;
import backend.dto.response.RoomTypeResponse;
import backend.entity.Role;
import backend.entity.Room;
import backend.entity.RoomStatus;
import backend.entity.RoomType;
import backend.entity.User;
import backend.exception.ForbiddenException;
import backend.exception.ResourceNotFoundException;
import backend.room.application.port.in.CreateRoomUseCase;
import backend.room.application.port.in.GetRoomDetailUseCase;
import backend.room.application.port.in.GetRoomTypeDetailUseCase;
import backend.room.application.port.in.ListRoomTypesUseCase;
import backend.room.application.port.in.ListRoomsUseCase;
import backend.room.application.port.in.command.CreateRoomCommand;
import backend.room.application.port.in.query.GetRoomDetailQuery;
import backend.room.application.port.in.query.GetRoomTypeDetailQuery;
import backend.room.application.port.in.query.ListRoomsQuery;
import backend.room.application.port.out.RoomActorPort;
import backend.room.application.port.out.RoomCatalogPort;
import backend.room.application.port.out.RoomMutationPort;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class RoomUseCaseService implements
        ListRoomsUseCase,
        GetRoomDetailUseCase,
        CreateRoomUseCase,
        ListRoomTypesUseCase,
        GetRoomTypeDetailUseCase {

    private final RoomCatalogPort roomCatalogPort;
    private final RoomMutationPort roomMutationPort;
    private final RoomActorPort roomActorPort;

    @Override
    public List<RoomResponse> getRooms(ListRoomsQuery query) {
        return roomCatalogPort.loadRooms(query.roomTypeId(), query.status()).stream()
                .map(RoomResponse::from)
                .toList();
    }

    @Override
    public RoomResponse getRoom(GetRoomDetailQuery query) {
        if (query.roomId() == null) {
            throw new IllegalArgumentException("roomId khong duoc de trong");
        }

        Room room = roomCatalogPort.loadRoom(query.roomId())
                .orElseThrow(() -> new ResourceNotFoundException("Khong tim thay phong tap"));

        return RoomResponse.from(room);
    }

    @Override
    @Transactional
    public RoomResponse createRoom(CreateRoomCommand command) {
        String currentUserEmail = normalizeRequired(command.currentUserEmail(), "Nguoi dung hien tai khong hop le");
        String roomName = normalizeRequired(command.roomName(), "Ten phong khong duoc de trong");

        if (command.roomTypeId() == null) {
            throw new IllegalArgumentException("roomTypeId khong duoc de trong");
        }

        User currentUser = roomActorPort.loadUserByEmail(currentUserEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Khong tim thay nguoi dung"));

        if (currentUser.getRole() != Role.ADMIN) {
            throw new ForbiddenException("Chi admin co quyen them phong tap");
        }

        if (roomCatalogPort.existsRoomName(roomName)) {
            throw new IllegalArgumentException("Ten phong da ton tai");
        }

        RoomType roomType = roomCatalogPort.loadRoomType(command.roomTypeId())
                .orElseThrow(() -> new ResourceNotFoundException("Khong tim thay loai phong"));

        Room room = Room.builder()
                .roomName(roomName)
                .roomType(roomType)
                .status(command.status() == null ? RoomStatus.AVAILABLE : command.status())
                .build();

        return RoomResponse.from(roomMutationPort.saveRoom(room));
    }

    @Override
    public List<RoomTypeResponse> getRoomTypes() {
        return roomCatalogPort.loadRoomTypes().stream()
                .map(RoomTypeResponse::from)
                .toList();
    }

    @Override
    public RoomTypeResponse getRoomType(GetRoomTypeDetailQuery query) {
        if (query.roomTypeId() == null) {
            throw new IllegalArgumentException("roomTypeId khong duoc de trong");
        }

        RoomType roomType = roomCatalogPort.loadRoomType(query.roomTypeId())
                .orElseThrow(() -> new ResourceNotFoundException("Khong tim thay loai phong"));

        return RoomTypeResponse.from(roomType);
    }

    private String normalizeRequired(String value, String message) {
        if (value == null || value.trim().isBlank()) {
            throw new IllegalArgumentException(message);
        }

        return value.trim();
    }
}
