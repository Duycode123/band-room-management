package backend.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "hang_phong")
public class RoomType {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "ten_hang", nullable = false, unique = true)
    private String typeName;

    @Column(name = "mo_ta", columnDefinition = "TEXT")
    private String description;

    @Column(name = "gia_gio", nullable = false, precision = 12, scale = 2)
    private BigDecimal pricePerHour;

    @Column(name = "suc_chua")
    private Integer capacity;

    @Transient
    private LocalDateTime createdAt;

    @Transient
    private LocalDateTime updatedAt;

    @PrePersist
    public void prePersist() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    public void preUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
