package backend.repository;

import backend.entity.Booking;
import backend.entity.BookingStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface BookingRepository extends JpaRepository<Booking, Integer>, JpaSpecificationExecutor<Booking> {

    List<Booking> findByCustomer_IdOrderByCreatedAtDesc(Integer customerId);

    boolean existsByRoom_Id(Integer roomId);

    boolean existsByDiscountCode_Id(Integer discountCodeId);

    Optional<Booking> findByIdAndCustomer_Account_Email(Integer bookingId, String email);

    List<Booking> findTop10ByStatusNotOrderByCreatedAtDesc(BookingStatus status);

    @Query("""
            SELECT b
            FROM Booking b
            WHERE b.room.id = :roomId
              AND cast(b.status as string) <> 'CANCELLED'
              AND b.startTime < :endTime
              AND b.endTime > :startTime
            ORDER BY b.startTime ASC, b.endTime ASC
            """)
    List<Booking> findBlockingBookings(
            @Param("roomId") Integer roomId,
            @Param("startTime") LocalDateTime startTime,
            @Param("endTime") LocalDateTime endTime
    );

    @Query("""
            SELECT b
            FROM Booking b
            JOIN FETCH b.room
            JOIN FETCH b.customer
            WHERE cast(b.status as string) <> 'CANCELLED'
              AND b.startTime < :endTime
              AND b.endTime > :startTime
            ORDER BY b.startTime ASC, b.endTime ASC, b.room.roomName ASC
            """)
    List<Booking> findBookingsOverlappingWindow(
            @Param("startTime") LocalDateTime startTime,
            @Param("endTime") LocalDateTime endTime
    );

    @Query("""
            SELECT b
            FROM Booking b
            WHERE b.status = :pendingStatus
              AND b.createdAt IS NOT NULL
              AND b.createdAt < :cutoff
            """)
    List<Booking> findStalePendingBookings(
            @Param("pendingStatus") BookingStatus pendingStatus,
            @Param("cutoff") LocalDateTime cutoff
    );

    @Query("""
            SELECT b
            FROM Booking b
            WHERE b.status = :checkedInStatus
              AND b.endTime IS NOT NULL
              AND b.endTime <= :now
            """)
    List<Booking> findCheckedInBookingsPastEnd(
            @Param("checkedInStatus") BookingStatus checkedInStatus,
            @Param("now") LocalDateTime now
    );

    @Query("""
            select b.room.id as roomId,
                   count(b.id) as upcomingBookingCount,
                   min(b.startTime) as nextStartTime
            from Booking b
            where cast(b.status as string) <> 'CANCELLED'
              and b.endTime > :fromTime
              and b.startTime < :toTime
            group by b.room.id
            """)
    List<RoomUpcomingBookingStatsProjection> findUpcomingRoomBookingStats(
            @Param("fromTime") LocalDateTime fromTime,
            @Param("toTime") LocalDateTime toTime
    );

    interface RoomUpcomingBookingStatsProjection {
        Integer getRoomId();

        Long getUpcomingBookingCount();

        LocalDateTime getNextStartTime();
    }
}
