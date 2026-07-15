package backend.service.ai;

import backend.dto.response.AiSuggestedRoomResponse;
import backend.entity.RoomStatus;
import backend.repository.DiscountCodeRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

@ExtendWith(MockitoExtension.class)
class LocalChatAnswerBuilderHighestRatedTest {

    @Mock
    private DiscountCodeRepository discountCodeRepository;

    private LocalChatAnswerBuilder builder;

    @BeforeEach
    void setUp() {
        builder = new LocalChatAnswerBuilder(discountCodeRepository);
    }

    @Test
    void answersHighestRatedRoomByAverageRating() {
        ChatIntent intent = new ChatIntent(
                "phòng nào đánh giá cao nhất",
                "phong nao danh gia cao nhat",
                null,
                null,
                null,
                List.of(),
                null,
                "TOP_RATED",
                "REGEX"
        );

        List<AiSuggestedRoomResponse> rooms = List.of(
                room("Studio B", 4.2, 3L),
                room("Studio A", 4.9, 12L),
                room("Studio C", 4.9, 2L)
        );

        String answer = builder.build(intent, rooms, rooms);

        assertTrue(answer.contains("Studio A"));
        assertTrue(answer.toLowerCase().contains("cao nhất") || answer.contains("đánh giá cao nhất"));
        assertFalse(answer.contains("Mình có thông tin phòng như sau"));
    }

    @Test
    void explainsWhenNoApprovedRatingsExist() {
        ChatIntent intent = new ChatIntent(
                "phòng nào đánh giá cao nhất",
                "phong nao danh gia cao nhat",
                null,
                null,
                null,
                List.of(),
                null,
                "TOP_RATED",
                "REGEX"
        );

        List<AiSuggestedRoomResponse> rooms = List.of(
                room("Studio B", null, 0L),
                room("Studio A", null, null)
        );

        String answer = builder.build(intent, rooms, rooms);

        assertTrue(answer.contains("chưa có phòng nào có đánh giá") || answer.contains("Chưa có"));
    }

    private static AiSuggestedRoomResponse room(String name, Double rating, Long reviewCount) {
        return AiSuggestedRoomResponse.builder()
                .roomId(name.hashCode())
                .roomName(name)
                .roomTypeName("Band Rehearsal")
                .pricePerHour(new BigDecimal("320000"))
                .capacity(6)
                .status(RoomStatus.AVAILABLE)
                .averageRating(rating)
                .approvedReviewCount(reviewCount)
                .build();
    }
}
