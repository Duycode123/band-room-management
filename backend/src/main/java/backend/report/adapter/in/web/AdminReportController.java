package backend.report.adapter.in.web;

import backend.common.ApiResponse;
import backend.report.adapter.in.web.dto.RevenueUsageReportResponse;
import backend.report.adapter.in.web.mapper.RevenueUsageReportWebMapper;
import backend.report.domain.model.ReportBucket;
import backend.report.domain.port.in.GetRevenueUsageReportQuery;
import backend.report.domain.port.in.GetRevenueUsageReportUseCase;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;

@RestController
@RequestMapping("/api/admin/reports")
@RequiredArgsConstructor
public class AdminReportController {

    private final GetRevenueUsageReportUseCase getRevenueUsageReportUseCase;
    private final RevenueUsageReportWebMapper mapper;

    @GetMapping("/revenue-usage")
    public ResponseEntity<ApiResponse<RevenueUsageReportResponse>> getRevenueUsageReport(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime to,
            @RequestParam(defaultValue = "DAY") ReportBucket bucket
    ) {
        RevenueUsageReportResponse data = mapper.toResponse(
                getRevenueUsageReportUseCase.getRevenueUsageReport(
                        new GetRevenueUsageReportQuery(from, to, bucket)
                )
        );

        return ResponseEntity.ok(ApiResponse.<RevenueUsageReportResponse>builder()
                .success(true)
                .message("Revenue and room usage report loaded successfully")
                .data(data)
                .build());
    }
}
