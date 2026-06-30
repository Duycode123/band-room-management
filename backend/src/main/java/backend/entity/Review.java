package backend.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(
        name = "danh_gia",
        uniqueConstraints = {
                @UniqueConstraint(name = "uk_danh_gia_dat_phong", columnNames = "dat_phong_id")
        }
)
public class Review {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "dat_phong_id", nullable = false)
    private Booking booking;

    @Column(name = "diem", nullable = false)
    private Integer rating;

    @Column(name = "noi_dung", columnDefinition = "TEXT")
    private String content;

    @Column(name = "da_duyet", nullable = false)
    private Boolean approved;

    @Column(name = "ngay_tao", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    public void prePersist() {
        createdAt = LocalDateTime.now();

        if (approved == null) {
            approved = false;
        }
    }
}
