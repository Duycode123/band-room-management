package backend.facilitycondition.adapter.in.web;

import backend.common.ApiResponse;
import backend.facilitycondition.adapter.in.web.dto.response.FacilityConditionReportResponse;
import backend.facilitycondition.application.port.in.GetFacilityConditionHistoryUseCase;
import backend.facilitycondition.application.port.in.query.FacilityConditionHistoryQuery;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/admin/facility")
@RequiredArgsConstructor
public class AdminFacilityConditionController {

    private final GetFacilityConditionHistoryUseCase getFacilityConditionHistoryUseCase;

    @GetMapping("/condition-reports")
    public ResponseEntity<ApiResponse<List<FacilityConditionReportResponse>>> getConditionReports(
            @RequestParam(required = false) Integer roomId,
            @RequestParam(required = false) Integer equipmentId,
            @RequestParam(required = false) Boolean maintenanceSuggested,
            @RequestParam(required = false) Integer limit
    ) {
        List<FacilityConditionReportResponse> data = getFacilityConditionHistoryUseCase
                .getHistory(new FacilityConditionHistoryQuery(roomId, equipmentId, maintenanceSuggested, limit))
                .stream()
                .map(FacilityConditionReportResponse::from)
                .toList();

        return ResponseEntity.ok(ApiResponse.<List<FacilityConditionReportResponse>>builder()
                .success(true)
                .message("Danh sach lich su ghi nhan tinh trang co so vat chat")
                .data(data)
                .build());
    }
}
