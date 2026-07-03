package backend.room.adapter.out.persistence;

import backend.equipment.adapter.out.persistence.EquipmentRepository;
import backend.entity.Room;
import backend.entity.RoomStatus;
import backend.entity.RoomType;
import backend.entity.User;
import backend.repository.BookingRepository;
import backend.repository.RoomRepository;
import backend.repository.RoomTypeRepository;
import backend.repository.UserRepository;
import backend.room.application.port.out.RoomActorPort;
import backend.room.application.port.out.RoomCatalogPort;
import backend.room.application.port.out.RoomMutationPort;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Optional;

@Component
@RequiredArgsConstructor
public class RoomPersistenceAdapter implements
        RoomCatalogPort,
        RoomMutationPort,
        RoomActorPort {

    private final RoomRepository roomRepository;
    private final RoomTypeRepository roomTypeRepository;
    private final UserRepository userRepository;
    private final BookingRepository bookingRepository;
    private final EquipmentRepository equipmentRepository;

    @Override
    public List<Room> loadRooms(Integer roomTypeId, RoomStatus status) {
        if (roomTypeId != null && status != null) {
            return roomRepository.findByRoomType_IdAndStatusOrderByRoomNameAsc(roomTypeId, status);
        }
        if (roomTypeId != null) {
            return roomRepository.findByRoomType_IdOrderByRoomNameAsc(roomTypeId);
        }
        if (status != null) {
            return roomRepository.findByStatusOrderByRoomNameAsc(status);
        }

        return roomRepository.findAllByOrderByRoomNameAsc();
    }

    @Override
    public Optional<Room> loadRoom(Integer roomId) {
        return roomRepository.findById(roomId);
    }

    @Override
    public Optional<Room> loadRoomForUpdate(Integer roomId) {
        return roomRepository.findByIdForUpdate(roomId);
    }

    @Override
    public boolean existsRoomName(String roomName) {
        return roomRepository.existsByRoomName(roomName);
    }

    @Override
    public boolean existsBookingForRoom(Integer roomId) {
        return bookingRepository.existsByRoom_Id(roomId);
    }

    @Override
    public boolean existsEquipmentForRoom(Integer roomId) {
        return equipmentRepository.existsByRoom_Id(roomId);
    }

    @Override
    public List<RoomType> loadRoomTypes() {
        return roomTypeRepository.findAllByOrderByTypeNameAsc();
    }

    @Override
    public Optional<RoomType> loadRoomType(Integer roomTypeId) {
        return roomTypeRepository.findById(roomTypeId);
    }

    @Override
    public Room saveRoom(Room room) {
        return roomRepository.save(room);
    }

    @Override
    public void deleteRoom(Room room) {
        roomRepository.delete(room);
    }

    @Override
    public Optional<User> loadUserByEmail(String email) {
        return userRepository.findByEmail(email);
    }
}
