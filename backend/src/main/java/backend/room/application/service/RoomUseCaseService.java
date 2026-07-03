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
import backend.room.application.port.in.DeleteRoomUseCase;
import backend.room.application.port.in.GetRoomDetailUseCase;
import backend.room.application.port.in.GetRoomTypeDetailUseCase;
import backend.room.application.port.in.ListRoomTypesUseCase;
import backend.room.application.port.in.ListRoomsUseCase;
import backend.room.application.port.in.UpdateRoomStatusUseCase;
import backend.room.application.port.in.UpdateRoomUseCase;
import backend.room.application.port.in.command.CreateRoomCommand;
import backend.room.application.port.in.command.DeleteRoomCommand;
import backend.room.application.port.in.command.UpdateRoomCommand;
import backend.room.application.port.in.command.UpdateRoomStatusCommand;
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
        UpdateRoomUseCase,
        UpdateRoomStatusUseCase,
        DeleteRoomUseCase,
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
        User currentUser = getCurrentUser(command.currentUserEmail());
        assertAdminRole(currentUser, "Chi admin co quyen them phong tap");

        String roomName = normalizeRequired(command.roomName(), "Ten phong khong duoc de trong");

        if (command.roomTypeId() == null) {
            throw new IllegalArgumentException("roomTypeId khong duoc de trong");
        }
        validateMaxPeople(command.maxPeople());

        if (roomCatalogPort.existsRoomName(roomName)) {
            throw new IllegalArgumentException("Ten phong da ton tai");
        }

        RoomType roomType = loadRoomTypeRequired(command.roomTypeId());

        Room room = Room.builder()
                .roomName(roomName)
                .roomType(roomType)
                .maxPeople(command.maxPeople())
                .imageUrl(normalizeOptionalImageUrl(command.imageUrl()))
                .status(command.status() == null ? RoomStatus.AVAILABLE : command.status())
                .build();

        return RoomResponse.from(roomMutationPort.saveRoom(room));
    }

    @Override
    @Transactional
    public RoomResponse updateRoom(UpdateRoomCommand command) {
        User currentUser = getCurrentUser(command.currentUserEmail());
        assertAdminRole(currentUser, "Chi admin co quyen quan ly phong tap");

        if (command.roomId() == null) {
            throw new IllegalArgumentException("roomId khong duoc de trong");
        }
        if (command.roomTypeId() == null) {
            throw new IllegalArgumentException("roomTypeId khong duoc de trong");
        }
        if (command.status() == null) {
            throw new IllegalArgumentException("Trang thai phong khong duoc de trong");
        }
        validateMaxPeople(command.maxPeople());

        Room room = roomCatalogPort.loadRoomForUpdate(command.roomId())
                .orElseThrow(() -> new ResourceNotFoundException("Khong tim thay phong tap"));

        String roomName = normalizeRequired(command.roomName(), "Ten phong khong duoc de trong");
        if (!room.getRoomName().equals(roomName) && roomCatalogPort.existsRoomName(roomName)) {
            throw new IllegalArgumentException("Ten phong da ton tai");
        }

        RoomType roomType = loadRoomTypeRequired(command.roomTypeId());

        room.setRoomName(roomName);
        room.setRoomType(roomType);
        room.setMaxPeople(command.maxPeople());
        room.setImageUrl(normalizeOptionalImageUrl(command.imageUrl()));
        room.setStatus(command.status());

        return RoomResponse.from(roomMutationPort.saveRoom(room));
    }

    @Override
    @Transactional
    public RoomResponse updateRoomStatus(UpdateRoomStatusCommand command) {
        User currentUser = getCurrentUser(command.currentUserEmail());
        assertAdminRole(currentUser, "Chi admin co quyen quan ly phong tap");

        if (command.roomId() == null) {
            throw new IllegalArgumentException("roomId khong duoc de trong");
        }
        if (command.status() == null) {
            throw new IllegalArgumentException("Trang thai phong khong duoc de trong");
        }

        Room room = roomCatalogPort.loadRoomForUpdate(command.roomId())
                .orElseThrow(() -> new ResourceNotFoundException("Khong tim thay phong tap"));

        room.setStatus(command.status());

        return RoomResponse.from(roomMutationPort.saveRoom(room));
    }

    @Override
    @Transactional
    public void deleteRoom(DeleteRoomCommand command) {
        User currentUser = getCurrentUser(command.currentUserEmail());
        assertAdminRole(currentUser, "Chi admin co quyen quan ly phong tap");

        if (command.roomId() == null) {
            throw new IllegalArgumentException("roomId khong duoc de trong");
        }

        Room room = roomCatalogPort.loadRoomForUpdate(command.roomId())
                .orElseThrow(() -> new ResourceNotFoundException("Khong tim thay phong tap"));

        if (roomCatalogPort.existsBookingForRoom(command.roomId())) {
            throw new IllegalStateException("Khong the xoa phong da phat sinh booking");
        }

        if (roomCatalogPort.existsEquipmentForRoom(command.roomId())) {
            throw new IllegalStateException("Khong the xoa phong dang co thiet bi");
        }

        roomMutationPort.deleteRoom(room);
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

        return RoomTypeResponse.from(loadRoomTypeRequired(query.roomTypeId()));
    }

    private User getCurrentUser(String email) {
        String normalizedEmail = normalizeRequired(email, "Nguoi dung hien tai khong hop le");

        return roomActorPort.loadUserByEmail(normalizedEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Khong tim thay nguoi dung"));
    }

    private void assertAdminRole(User currentUser, String message) {
        if (currentUser.getRole() != Role.ADMIN) {
            throw new ForbiddenException(message);
        }
    }

    private RoomType loadRoomTypeRequired(Integer roomTypeId) {
        return roomCatalogPort.loadRoomType(roomTypeId)
                .orElseThrow(() -> new ResourceNotFoundException("Khong tim thay loai phong"));
    }

    private String normalizeRequired(String value, String message) {
        if (value == null || value.trim().isBlank()) {
            throw new IllegalArgumentException(message);
        }

        return value.trim();
    }

    private void validateMaxPeople(Integer maxPeople) {
        if (maxPeople == null) {
            throw new IllegalArgumentException("Suc chua toi da khong duoc de trong");
        }
        if (maxPeople < 1 || maxPeople > 100) {
            throw new IllegalArgumentException("Suc chua toi da phai nam trong khoang 1-100");
        }
    }

    private String normalizeOptionalImageUrl(String imageUrl) {
        if (imageUrl == null || imageUrl.trim().isBlank()) {
            return null;
        }

        String normalized = imageUrl.trim();
        if (normalized.length() > 500) {
            throw new IllegalArgumentException("URL anh phong toi da 500 ky tu");
        }
        if (!normalized.matches("^https?://.+")) {
            throw new IllegalArgumentException("URL anh phong phai la link http hoac https");
        }

        return normalized;
    }
}
