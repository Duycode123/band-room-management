package backend.facilitycondition.adapter.out.persistence;

import backend.entity.Role;
import backend.entity.RoomStatus;
import backend.equipment.domain.model.EquipmentStatus;
import backend.facilitycondition.application.model.FacilityActor;
import backend.facilitycondition.application.port.out.FacilityConditionPort;
import backend.facilitycondition.domain.model.FacilityCondition;
import backend.facilitycondition.domain.model.FacilityConditionReport;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Timestamp;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Component
@RequiredArgsConstructor
public class JdbcFacilityConditionAdapter implements FacilityConditionPort {

    private final JdbcTemplate jdbcTemplate;

    @Override
    public Optional<FacilityActor> loadActorByEmail(String email) {
        String sql = """
                SELECT account.id AS account_id, account.role, staff.id AS staff_id
                FROM account
                LEFT JOIN staff ON staff.account_id = account.id
                WHERE LOWER(account.email) = LOWER(?)
                """;

        return jdbcTemplate.query(sql, (rs, rowNum) -> new FacilityActor(
                rs.getInt("account_id"),
                rs.getObject("staff_id", Integer.class),
                Role.valueOf(rs.getString("role"))
        ), email).stream().findFirst();
    }

    @Override
    public boolean existsRoom(Integer roomId) {
        String sql = "SELECT COUNT(*) FROM room WHERE id = ?";
        Integer count = jdbcTemplate.queryForObject(sql, Integer.class, roomId);
        return count != null && count > 0;
    }

    @Override
    public Optional<Integer> loadEquipmentRoomId(Integer equipmentId) {
        String sql = "SELECT room_id FROM equipment WHERE id = ?";
        return jdbcTemplate.query(sql, (rs, rowNum) -> rs.getInt("room_id"), equipmentId)
                .stream()
                .findFirst();
    }

    @Override
    public void updateRoomStatus(Integer roomId, RoomStatus status) {
        String sql = """
                UPDATE room
                SET status = CAST(? AS room_status)
                WHERE id = ?
                """;

        jdbcTemplate.update(sql, status.name(), roomId);
    }

    @Override
    public void updateEquipmentStatus(Integer equipmentId, EquipmentStatus status, String note) {
        String sql = """
                UPDATE equipment
                SET status = CAST(? AS equipment_status),
                    notes = COALESCE(?, notes)
                WHERE id = ?
                """;

        jdbcTemplate.update(sql, status.name(), note, equipmentId);
    }

    @Override
    public FacilityConditionReport saveReport(FacilityConditionReport report) {
        String sql = """
                INSERT INTO facility_condition_report (
                    id,
                    staff_id,
                    room_id,
                    equipment_id,
                    condition,
                    note,
                    image_url,
                    maintenance_suggested,
                    room_status_after_update,
                    created_at
                )
                VALUES (?, ?, ?, ?, CAST(? AS facility_condition), ?, ?, ?, CAST(? AS room_status), ?)
                """;

        jdbcTemplate.update(
                sql,
                report.id(),
                report.staffId(),
                report.roomId(),
                report.equipmentId(),
                report.condition().name(),
                report.note(),
                report.imageUrl(),
                report.maintenanceSuggested(),
                report.roomStatusAfterUpdate() == null ? null : report.roomStatusAfterUpdate().name(),
                Timestamp.valueOf(report.createdAt())
        );

        return report;
    }

    @Override
    public List<FacilityConditionReport> loadHistory(
            Integer roomId,
            Integer equipmentId,
            Boolean maintenanceSuggested,
            int limit
    ) {
        StringBuilder sql = new StringBuilder("""
                SELECT id,
                       staff_id,
                       room_id,
                       equipment_id,
                       condition,
                       note,
                       image_url,
                       maintenance_suggested,
                       room_status_after_update,
                       created_at
                FROM facility_condition_report
                WHERE 1 = 1
                """);
        List<Object> args = new ArrayList<>();

        if (roomId != null) {
            sql.append(" AND room_id = ?");
            args.add(roomId);
        }
        if (equipmentId != null) {
            sql.append(" AND equipment_id = ?");
            args.add(equipmentId);
        }
        if (maintenanceSuggested != null) {
            sql.append(" AND maintenance_suggested = ?");
            args.add(maintenanceSuggested);
        }

        sql.append(" ORDER BY created_at DESC LIMIT ?");
        args.add(limit);

        return jdbcTemplate.query(sql.toString(), this::mapReport, args.toArray());
    }

    private FacilityConditionReport mapReport(ResultSet rs, int rowNum) throws SQLException {
        String roomStatus = rs.getString("room_status_after_update");
        return FacilityConditionReport.builder()
                .id((UUID) rs.getObject("id"))
                .staffId(rs.getInt("staff_id"))
                .roomId(rs.getInt("room_id"))
                .equipmentId(rs.getObject("equipment_id", Integer.class))
                .condition(FacilityCondition.valueOf(rs.getString("condition")))
                .note(rs.getString("note"))
                .imageUrl(rs.getString("image_url"))
                .maintenanceSuggested(rs.getBoolean("maintenance_suggested"))
                .roomStatusAfterUpdate(roomStatus == null ? null : RoomStatus.valueOf(roomStatus))
                .createdAt(rs.getTimestamp("created_at").toLocalDateTime())
                .build();
    }
}
