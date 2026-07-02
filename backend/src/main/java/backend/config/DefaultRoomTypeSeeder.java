package backend.config;

import backend.entity.RoomType;
import backend.repository.RoomTypeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

@Component
@RequiredArgsConstructor
public class DefaultRoomTypeSeeder implements ApplicationRunner {

    private final RoomTypeRepository roomTypeRepository;

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        if (roomTypeRepository.count() > 0) {
            return;
        }

        roomTypeRepository.saveAll(List.of(
                RoomType.builder()
                        .typeName("Standard Practice")
                        .description("Practice room for solo artists or small groups.")
                        .pricePerHour(new BigDecimal("150000"))
                        .build(),
                RoomType.builder()
                        .typeName("Band Rehearsal")
                        .description("Full rehearsal room for bands and live practice sessions.")
                        .pricePerHour(new BigDecimal("320000"))
                        .build(),
                RoomType.builder()
                        .typeName("Recording & Mixing")
                        .description("Recording room for vocal, demo, podcast and mixing sessions.")
                        .pricePerHour(new BigDecimal("450000"))
                        .build(),
                RoomType.builder()
                        .typeName("Premium Studio")
                        .description("Premium private studio for professional rehearsal sessions.")
                        .pricePerHour(new BigDecimal("650000"))
                        .build()
        ));
    }
}
