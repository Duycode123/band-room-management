package backend.controller;

import backend.common.ApiResponse;
import backend.dto.response.HomepageSummaryResponse;
import backend.service.PublicHomepageService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/public/homepage")
@RequiredArgsConstructor
public class PublicHomepageController {

    private final PublicHomepageService publicHomepageService;

    @GetMapping("/summary")
    public ResponseEntity<ApiResponse<HomepageSummaryResponse>> getSummary() {
        return ResponseEntity.ok(ApiResponse.<HomepageSummaryResponse>builder()
                .success(true)
                .message("Lấy dữ liệu homepage thành công")
                .data(publicHomepageService.getSummary())
                .build());
    }
}
