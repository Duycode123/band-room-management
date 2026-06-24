package backend.controller;

import backend.common.ApiResponse;
import backend.dto.response.RoomTypeResponse;
import backend.service.RoomService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/room-types")
@RequiredArgsConstructor
public class RoomTypeController {

    private final RoomService roomService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<RoomTypeResponse>>> getRoomTypes() {
        return ResponseEntity.ok(ApiResponse.<List<RoomTypeResponse>>builder()
                .success(true)
                .message("Lấy danh sách loại phòng thành công")
                .data(roomService.getRoomTypes())
                .build());
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<RoomTypeResponse>> getRoomType(@PathVariable Integer id) {
        return ResponseEntity.ok(ApiResponse.<RoomTypeResponse>builder()
                .success(true)
                .message("Lấy thông tin loại phòng thành công")
                .data(roomService.getRoomType(id))
                .build());
    }
}
