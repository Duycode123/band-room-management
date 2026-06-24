package backend.repository;

import backend.entity.Room;
import backend.entity.RoomStatus;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface RoomRepository extends JpaRepository<Room, Integer> {

    @EntityGraph(attributePaths = "roomType")
    List<Room> findAllByOrderByRoomNameAsc();

    @EntityGraph(attributePaths = "roomType")
    List<Room> findByStatusOrderByRoomNameAsc(RoomStatus status);

    @EntityGraph(attributePaths = "roomType")
    List<Room> findByRoomType_IdOrderByRoomNameAsc(Integer roomTypeId);

    @EntityGraph(attributePaths = "roomType")
    List<Room> findByRoomType_IdAndStatusOrderByRoomNameAsc(Integer roomTypeId, RoomStatus status);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @EntityGraph(attributePaths = "roomType")
    @Query("SELECT r FROM Room r WHERE r.id = :id")
    Optional<Room> findByIdForUpdate(@Param("id") Integer id);
}
