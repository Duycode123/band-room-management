package backend.controller;

import backend.booking.application.port.in.GetRoomAvailabilityUseCase;
import backend.booking.application.port.in.query.GetRoomAvailabilityQuery;
import backend.common.ApiResponse;
import backend.dto.request.CreateRoomRequest;
import backend.dto.response.RoomAvailabilityResponse;
import backend.dto.response.RoomResponse;
import backend.entity.RoomStatus;
import backend.room.application.port.in.CreateRoomUseCase;
import backend.room.application.port.in.GetRoomDetailUseCase;
import backend.room.application.port.in.ListRoomsUseCase;
import backend.room.application.port.in.command.CreateRoomCommand;
import backend.room.application.port.in.query.GetRoomDetailQuery;
import backend.room.application.port.in.query.ListRoomsQuery;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/rooms")
@RequiredArgsConstructor
public class RoomController {

    private final ListRoomsUseCase listRoomsUseCase;
    private final GetRoomDetailUseCase getRoomDetailUseCase;
    private final CreateRoomUseCase createRoomUseCase;
    private final GetRoomAvailabilityUseCase getRoomAvailabilityUseCase;

    @GetMapping
    public ResponseEntity<ApiResponse<List<RoomResponse>>> getRooms(
            @RequestParam(required = false) Integer roomTypeId,
            @RequestParam(required = false) RoomStatus status
    ) {
        return ResponseEntity.ok(ApiResponse.<List<RoomResponse>>builder()
                .success(true)
                .message("Lay danh sach phong thanh cong")
                .data(listRoomsUseCase.getRooms(new ListRoomsQuery(roomTypeId, status)))
                .build());
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<RoomResponse>> getRoom(@PathVariable Integer id) {
        return ResponseEntity.ok(ApiResponse.<RoomResponse>builder()
                .success(true)
                .message("Lay thong tin phong thanh cong")
                .data(getRoomDetailUseCase.getRoom(new GetRoomDetailQuery(id)))
                .build());
    }

    @PostMapping
    public ResponseEntity<ApiResponse<RoomResponse>> createRoom(
            @Valid @RequestBody CreateRoomRequest request,
            Authentication authentication
    ) {
        RoomResponse room = createRoomUseCase.createRoom(new CreateRoomCommand(
                request.getRoomName(),
                request.getRoomTypeId(),
                request.getStatus(),
                authentication.getName()
        ));

        return ResponseEntity.status(201).body(ApiResponse.<RoomResponse>builder()
                .success(true)
                .message("Them phong tap thanh cong")
                .data(room)
                .build());
    }

    @GetMapping("/{id}/available-slots")
    public ResponseEntity<ApiResponse<RoomAvailabilityResponse>> getAvailableSlots(
            @PathVariable Integer id,
            @RequestParam
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME)
            LocalDateTime from,
            @RequestParam
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME)
            LocalDateTime to
    ) {
        return ResponseEntity.ok(ApiResponse.<RoomAvailabilityResponse>builder()
                .success(true)
                .message("Lay lich trong cua phong thanh cong")
                .data(getRoomAvailabilityUseCase.getAvailableSlots(new GetRoomAvailabilityQuery(id, from, to)))
                .build());
    }
}
