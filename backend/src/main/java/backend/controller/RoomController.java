package backend.controller;

import backend.common.ApiResponse;
import backend.dto.response.RoomResponse;
import backend.entity.RoomStatus;
import backend.service.RoomService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/rooms")
@RequiredArgsConstructor
public class RoomController {

    private final RoomService roomService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<RoomResponse>>> getRooms(
            @RequestParam(required = false) Long roomTypeId,
            @RequestParam(required = false) RoomStatus status
    ) {
        return ResponseEntity.ok(ApiResponse.<List<RoomResponse>>builder()
                .success(true)
                .message("Lấy danh sách phòng thành công")
                .data(roomService.getRooms(roomTypeId, status))
                .build());
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<RoomResponse>> getRoom(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.<RoomResponse>builder()
                .success(true)
                .message("Lấy thông tin phòng thành công")
                .data(roomService.getRoom(id))
                .build());
    }
}
