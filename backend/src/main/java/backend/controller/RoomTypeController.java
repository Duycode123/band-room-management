package backend.controller;

import backend.common.ApiResponse;
import backend.dto.response.RoomTypeResponse;
import backend.room.application.port.in.GetRoomTypeDetailUseCase;
import backend.room.application.port.in.ListRoomTypesUseCase;
import backend.room.application.port.in.query.GetRoomTypeDetailQuery;
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

    private final ListRoomTypesUseCase listRoomTypesUseCase;
    private final GetRoomTypeDetailUseCase getRoomTypeDetailUseCase;

    @GetMapping
    public ResponseEntity<ApiResponse<List<RoomTypeResponse>>> getRoomTypes() {
        return ResponseEntity.ok(ApiResponse.<List<RoomTypeResponse>>builder()
                .success(true)
                .message("Lay danh sach loai phong thanh cong")
                .data(listRoomTypesUseCase.getRoomTypes())
                .build());
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<RoomTypeResponse>> getRoomType(@PathVariable Integer id) {
        return ResponseEntity.ok(ApiResponse.<RoomTypeResponse>builder()
                .success(true)
                .message("Lay thong tin loai phong thanh cong")
                .data(getRoomTypeDetailUseCase.getRoomType(new GetRoomTypeDetailQuery(id)))
                .build());
    }
}
