package backend.controller;

import backend.common.ApiResponse;
import backend.dto.request.UpdateReviewApprovalRequest;
import backend.dto.response.PagedResponse;
import backend.dto.response.ReviewResponse;
import backend.service.ReviewService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/reviews")
@RequiredArgsConstructor
public class AdminReviewController {

    private final ReviewService reviewService;

    @GetMapping
    public ResponseEntity<ApiResponse<PagedResponse<ReviewResponse>>> getReviews(
            @RequestParam(required = false) Integer roomId,
            @RequestParam(required = false) Boolean approved,
            @RequestParam(required = false) Integer rating,
            @RequestParam(required = false) String keyword,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        PagedResponse<ReviewResponse> data = reviewService.getReviewsForAdmin(
                roomId,
                approved,
                rating,
                keyword,
                page,
                size
        );

        return ResponseEntity.ok(success("Lấy danh sách đánh giá cho admin thành công", data));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<ReviewResponse>> getReviewDetail(@PathVariable Integer id) {
        ReviewResponse data = reviewService.getReviewDetailForAdmin(id);

        return ResponseEntity.ok(success("Lấy chi tiết đánh giá thành công", data));
    }

    @PatchMapping("/{id}/approval")
    public ResponseEntity<ApiResponse<ReviewResponse>> updateApproval(
            @PathVariable Integer id,
            @Valid @RequestBody UpdateReviewApprovalRequest request
    ) {
        ReviewResponse data = reviewService.updateReviewApproval(id, request);

        return ResponseEntity.ok(success("Cập nhật trạng thái duyệt đánh giá thành công", data));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteReview(@PathVariable Integer id) {
        reviewService.deleteReview(id);

        return ResponseEntity.ok(success("Xóa đánh giá thành công", null));
    }

    private <T> ApiResponse<T> success(String message, T data) {
        return ApiResponse.<T>builder()
                .success(true)
                .message(message)
                .data(data)
                .build();
    }
}
