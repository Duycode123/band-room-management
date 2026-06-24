package backend.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Duration;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "dat_phong")
public class Booking {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "khach_hang_id", nullable = false)
    private Customer customer;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "phong_id", nullable = false)
    private Room room;

    @Column(name = "gio_bat_dau", nullable = false)
    private LocalDateTime startTime;

    @Column(name = "gio_ket_thuc", nullable = false)
    private LocalDateTime endTime;

    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.NAMED_ENUM)
    @Column(name = "phuong_thuc", nullable = false, columnDefinition = "phuong_thuc_thanh_toan")
    private PaymentMethod paymentMethod;

    @Column(name = "gia_gio_ap_dung", nullable = false, precision = 12, scale = 2)
    private BigDecimal pricePerHour;

    @Column(name = "tong_tien", nullable = false, precision = 12, scale = 2)
    private BigDecimal totalAmount;

    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.NAMED_ENUM)
    @Column(name = "trang_thai", nullable = false, columnDefinition = "trang_thai_dat_phong")
    private BookingStatus status;

    @Column(name = "ghi_chu", length = 500)
    private String note;

    @Column(name = "ghi_chu_nhac_cu", length = 500)
    private String instrumentNote;

    @Column(name = "ngay_tao", insertable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    public void prePersist() {
        if (status == null) {
            status = BookingStatus.CHO_THANH_TOAN;
        }
    }

    public String getBookingCode() {
        return id == null ? null : "BR%08d".formatted(id);
    }

    public BigDecimal getTotalHours() {
        if (startTime == null || endTime == null) {
            return null;
        }

        return BigDecimal.valueOf(Duration.between(startTime, endTime).toMinutes())
                .divide(BigDecimal.valueOf(60), 2, RoundingMode.HALF_UP);
    }
}
