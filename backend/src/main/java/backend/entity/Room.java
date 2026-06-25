package backend.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "phong")
public class Room {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "ten", nullable = false, unique = true)
    private String roomName;

    @ManyToOne
    @JoinColumn(name = "hang_phong_id", nullable = false)
    private RoomType roomType;

    @Builder.Default
    @OneToMany(mappedBy = "room", fetch = FetchType.LAZY)
    @OrderBy("name ASC")
    private List<Equipment> equipment = new ArrayList<>();

    @Transient
    private Integer floor;

    @Transient
    private Integer maxPeople;

    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.NAMED_ENUM)
    @Column(name = "trang_thai", nullable = false, columnDefinition = "trang_thai_phong")
    private RoomStatus status;

    @Transient
    private String description;

    @Transient
    private String imageUrl;

    @Transient
    private LocalDateTime createdAt;

    @Transient
    private LocalDateTime updatedAt;

    @PrePersist
    public void prePersist() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();

        if (status == null) {
            status = RoomStatus.TRONG;
        }
    }

    @PreUpdate
    public void preUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
