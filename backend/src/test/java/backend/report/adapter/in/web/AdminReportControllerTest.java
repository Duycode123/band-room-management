package backend.report.adapter.in.web;

import backend.exception.GlobalExceptionHandler;
import backend.report.adapter.in.web.mapper.RevenueUsageReportWebMapper;
import backend.report.adapter.in.web.mapper.RoomPerformanceReportWebMapper;
import backend.report.domain.model.RoomPerformanceReport;
import backend.report.domain.model.RoomPerformanceSummary;
import backend.report.domain.port.in.GetRoomPerformanceReportQuery;
import backend.report.domain.port.in.GetRoomPerformanceReportUseCase;
import backend.report.domain.port.in.GetRevenueUsageReportUseCase;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.databind.json.JsonMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.converter.json.MappingJackson2HttpMessageConverter;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.time.LocalDate;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class AdminReportControllerTest {

    @Mock
    private GetRevenueUsageReportUseCase getRevenueUsageReportUseCase;

    @Mock
    private GetRoomPerformanceReportUseCase getRoomPerformanceReportUseCase;

    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        JsonMapper objectMapper = JsonMapper.builder()
                .addModule(new JavaTimeModule())
                .disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS)
                .build();

        mockMvc = MockMvcBuilders
                .standaloneSetup(new AdminReportController(
                        getRevenueUsageReportUseCase,
                        new RevenueUsageReportWebMapper(),
                        getRoomPerformanceReportUseCase,
                        new RoomPerformanceReportWebMapper()
                ))
                .setControllerAdvice(new GlobalExceptionHandler())
                .setMessageConverters(new MappingJackson2HttpMessageConverter(objectMapper))
                .build();
    }

    @Test
    void returnsRoomPerformanceReportForInclusiveDateRange() throws Exception {
        LocalDate startDate = LocalDate.of(2026, 7, 1);
        LocalDate endDate = LocalDate.of(2026, 7, 31);
        RoomPerformanceReport report = new RoomPerformanceReport(
                startDate,
                endDate,
                7,
                List.of(
                        new RoomPerformanceSummary(1, "Studio A", "Premium", 5),
                        new RoomPerformanceSummary(2, "Studio B", "Standard", 2),
                        new RoomPerformanceSummary(3, "Studio C", "Standard", 0)
                )
        );

        when(getRoomPerformanceReportUseCase.getRoomPerformanceReport(
                new GetRoomPerformanceReportQuery(startDate, endDate)
        )).thenReturn(report);

        mockMvc.perform(get("/api/admin/reports/room-performance")
                        .param("startDate", "2026-07-01")
                        .param("endDate", "2026-07-31"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("Room performance report loaded successfully"))
                .andExpect(jsonPath("$.data.startDate").value("2026-07-01"))
                .andExpect(jsonPath("$.data.endDate").value("2026-07-31"))
                .andExpect(jsonPath("$.data.totalSuccessfulBookings").value(7))
                .andExpect(jsonPath("$.data.rooms.length()").value(3))
                .andExpect(jsonPath("$.data.rooms[0].roomName").value("Studio A"))
                .andExpect(jsonPath("$.data.rooms[2].successfulBookingCount").value(0));
    }

    @Test
    void surfacesValidationErrorsFromRoomPerformanceUseCase() throws Exception {
        when(getRoomPerformanceReportUseCase.getRoomPerformanceReport(any()))
                .thenThrow(new IllegalArgumentException("endDate must be on or after startDate"));

        mockMvc.perform(get("/api/admin/reports/room-performance")
                        .param("startDate", "2026-07-31")
                        .param("endDate", "2026-07-01"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message").value("endDate must be on or after startDate"));
    }
}
