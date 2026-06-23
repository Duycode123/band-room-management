package backend.repository;

import backend.entity.Room;
import backend.entity.RoomStatus;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface RoomRepository extends JpaRepository<Room, Long> {

    @EntityGraph(attributePaths = "roomType")
    List<Room> findAllByOrderByRoomNameAsc();

    @EntityGraph(attributePaths = "roomType")
    List<Room> findByStatusOrderByRoomNameAsc(RoomStatus status);

    @EntityGraph(attributePaths = "roomType")
    List<Room> findByRoomType_IdOrderByRoomNameAsc(Long roomTypeId);

    @EntityGraph(attributePaths = "roomType")
    List<Room> findByRoomType_IdAndStatusOrderByRoomNameAsc(Long roomTypeId, RoomStatus status);
}
