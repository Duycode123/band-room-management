package backend.report.adapter.in.web;

import backend.common.ApiResponse;
import backend.report.adapter.in.web.dto.RoomPerformanceReportResponse;
import backend.report.adapter.in.web.dto.RevenueUsageReportResponse;
import backend.report.adapter.in.web.mapper.RoomPerformanceReportWebMapper;
import backend.report.adapter.in.web.mapper.RevenueUsageReportWebMapper;
import backend.report.domain.model.ReportBucket;
import backend.report.domain.port.in.GetRoomPerformanceReportQuery;
import backend.report.domain.port.in.GetRoomPerformanceReportUseCase;
import backend.report.domain.port.in.GetRevenueUsageReportQuery;
import backend.report.domain.port.in.GetRevenueUsageReportUseCase;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.time.LocalDateTime;

@RestController
@RequestMapping("/api/admin/reports")
@RequiredArgsConstructor
public class AdminReportController {

    private final GetRevenueUsageReportUseCase getRevenueUsageReportUseCase;
    private final RevenueUsageReportWebMapper revenueUsageReportWebMapper;
    private final GetRoomPerformanceReportUseCase getRoomPerformanceReportUseCase;
    private final RoomPerformanceReportWebMapper roomPerformanceReportWebMapper;

    @GetMapping("/revenue-usage")
    public ResponseEntity<ApiResponse<RevenueUsageReportResponse>> getRevenueUsageReport(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime to,
            @RequestParam(defaultValue = "DAY") ReportBucket bucket
    ) {
        RevenueUsageReportResponse data = revenueUsageReportWebMapper.toResponse(
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

    @GetMapping("/room-performance")
    public ResponseEntity<ApiResponse<RoomPerformanceReportResponse>> getRoomPerformanceReport(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate
    ) {
        RoomPerformanceReportResponse data = roomPerformanceReportWebMapper.toResponse(
                getRoomPerformanceReportUseCase.getRoomPerformanceReport(
                        new GetRoomPerformanceReportQuery(startDate, endDate)
                )
        );

        return ResponseEntity.ok(ApiResponse.<RoomPerformanceReportResponse>builder()
                .success(true)
                .message("Room performance report loaded successfully")
                .data(data)
                .build());
    }
}
