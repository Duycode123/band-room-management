package backend.service.ai;

import backend.dto.response.AiSuggestedRoomResponse;
import backend.service.GeminiAiClient;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class GeminiChatAdvisorTest {

    @Mock
    private GeminiAiClient geminiAiClient;

    @Mock
    private LocalChatAnswerBuilder localChatAnswerBuilder;

    @InjectMocks
    private GeminiChatAdvisor advisor;

    @Test
    void advise_usesGeminiEvenForTopRatedIntent() {
        when(geminiAiClient.isConfigured()).thenReturn(true);
        when(geminiAiClient.getModel()).thenReturn("gemini-test");
        when(localChatAnswerBuilder.buildCouponContext()).thenReturn("none");
        when(geminiAiClient.chat(anyString(), anyString()))
                .thenReturn("Phòng Studio A đang có rating cao nhất (4.8/5), rất đáng thử.");

        ChatIntent intent = topRatedIntent();
        List<AiSuggestedRoomResponse> rooms = List.of(ratedRoom(1, "Studio A", 4.8, 12L));
        String local = "Theo đánh giá, Studio A cao nhất.";

        GeminiChatAdvisor.Advice advice = advisor.advise(intent, rooms, rooms, local, List.of(), List.of());

        assertTrue(advice.usedAi());
        assertTrue(advice.answer().contains("Studio A"));
        assertTrue(advice.mode().startsWith("GEMINI_GROUNDED:"));
        verify(geminiAiClient).chat(anyString(), anyString());
    }

    @Test
    void advise_fallsBackWhenTopRatedAnswerOmitsWinner() {
        when(geminiAiClient.isConfigured()).thenReturn(true);
        when(localChatAnswerBuilder.buildCouponContext()).thenReturn("none");
        when(geminiAiClient.chat(anyString(), anyString()))
                .thenReturn("Mình ưu tiên phòng khác vì sẵn sàng đặt ngay.");

        ChatIntent intent = topRatedIntent();
        List<AiSuggestedRoomResponse> rooms = List.of(ratedRoom(1, "Studio A", 4.8, 12L));
        String local = "Theo đánh giá, Studio A cao nhất.";

        GeminiChatAdvisor.Advice advice = advisor.advise(intent, rooms, rooms, local, List.of(), List.of());

        assertFalse(advice.usedAi());
        assertEquals(local, advice.answer());
        assertEquals("LOCAL_DB_RULES:GEMINI_UNGROUNDED", advice.mode());
    }

    @Test
    void isClearlyUngrounded_detectsMissingCheapestWinner() {
        ChatIntent intent = new ChatIntent(
                "phòng nào rẻ nhất",
                "phong nao re nhat",
                null,
                null,
                null,
                List.of(),
                null,
                "FIND_ROOM",
                "REGEX"
        );
        List<AiSuggestedRoomResponse> rooms = List.of(
                pricedRoom(1, "Budget Room", "150000"),
                pricedRoom(2, "Premium Room", "300000")
        );

        assertTrue(advisor.isClearlyUngrounded(intent, rooms, "Nên chọn Premium Room vì tiện nghi."));
        assertFalse(advisor.isClearlyUngrounded(intent, rooms, "Budget Room đang là lựa chọn rẻ nhất."));
    }

    private static ChatIntent topRatedIntent() {
        return new ChatIntent(
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
    }

    private static AiSuggestedRoomResponse ratedRoom(int id, String name, double rating, long count) {
        return AiSuggestedRoomResponse.builder()
                .roomId(id)
                .roomName(name)
                .pricePerHour(new BigDecimal("200000"))
                .averageRating(rating)
                .approvedReviewCount(count)
                .build();
    }

    private static AiSuggestedRoomResponse pricedRoom(int id, String name, String price) {
        return AiSuggestedRoomResponse.builder()
                .roomId(id)
                .roomName(name)
                .pricePerHour(new BigDecimal(price))
                .build();
    }
}
