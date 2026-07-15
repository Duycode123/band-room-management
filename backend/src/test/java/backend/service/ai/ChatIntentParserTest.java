package backend.service.ai;

import backend.dto.request.AiChatRequest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

class ChatIntentParserTest {

    private ChatIntentParser parser;

    @BeforeEach
    void setUp() {
        parser = new ChatIntentParser();
    }

    @Test
    void parsesPeopleFromSlangNg() {
        ChatIntent intent = parser.parse(request("toi muon tim phong cho 8ng"));
        assertEquals(8, intent.people());
    }

    @Test
    void parsesPeopleFromFullWord() {
        ChatIntent intent = parser.parse(request("Band 4 người nên chọn phòng nào?"));
        assertEquals(4, intent.people());
    }

    @Test
    void parsesBudgetUnder300k() {
        ChatIntent intent = parser.parse(request("Có phòng nào dưới 300k một giờ không?"));
        assertEquals(0, intent.maxPricePerHour().compareTo(BigDecimal.valueOf(300000)));
    }

    @Test
    void parsesHourRange() {
        ChatIntent intent = parser.parse(request("Tối nay 18h-20h còn phòng nào cho 4 người?"));
        assertEquals(4, intent.people());
        assertNotNull(intent.timeRange());
        assertEquals(18, intent.timeRange().startTime().getHour());
        assertEquals(20, intent.timeRange().endTime().getHour());
    }

    @Test
    void doesNotTreatGreetingAsEveningWindow() {
        ChatIntent intent = parser.parse(request("toi muon dat phong"));
        assertNull(intent.timeRange());
    }

    @Test
    void parsesEquipmentKeywords() {
        ChatIntent intent = parser.parse(request("Phòng nào có micro và mixer?"));
        assertTrue(intent.equipmentKeywords().contains("mic"));
        assertTrue(intent.equipmentKeywords().contains("mixer"));
        assertFalse(intent.equipmentKeywords().contains("drum"));
    }

    @Test
    void ignoresOpeningHoursAsBookingWindow() {
        ChatIntent intent = parser.parse(request("Studio mở cửa lúc mấy giờ?"));
        assertNull(intent.timeRange());
    }

    @Test
    void parsesRequestedRoomName() {
        ChatIntent intent = parser.parse(request("phòng ssssss thì sao"));
        assertEquals("ssssss", intent.requestedRoomName());
    }

    @Test
    void doesNotTreatGenericRoomPhraseAsRequestedName() {
        ChatIntent intent = parser.parse(request("toi muon tim phong cho 8ng"));
        assertNull(intent.requestedRoomName());
        assertEquals(8, intent.people());
    }

    @Test
    void doesNotTreatOtherRoomsPhraseAsRoomName() {
        ChatIntent other = parser.parse(request("tư vấn phòng khác đi"));
        assertNull(other.requestedRoomName());
        assertEquals("ROOM_SEARCH", other.category());

        ChatIntent otherType = parser.parse(request("ý tôi là tìm phòng loại khác"));
        assertNull(otherType.requestedRoomName());
        assertEquals("ROOM_SEARCH", otherType.category());
    }

    @Test
    void treatsHighestRatedQuestionAsTopRatedCategory() {
        ChatIntent intent = parser.parse(request("phòng nào đánh giá cao nhất"));
        assertNull(intent.requestedRoomName());
        assertEquals("TOP_RATED", intent.category());
    }

    @Test
    void parsesSpecificRoomNameStillWorks() {
        ChatIntent intent = parser.parse(request("xem phòng A1"));
        assertEquals("a1", intent.requestedRoomName());
    }

    private static AiChatRequest request(String message) {
        AiChatRequest request = new AiChatRequest();
        request.setMessage(message);
        return request;
    }
}
