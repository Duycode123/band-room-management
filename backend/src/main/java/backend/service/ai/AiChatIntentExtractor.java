package backend.service.ai;

import backend.dto.request.AiChatRequest;
import backend.service.GeminiAiClient;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

@Component
@RequiredArgsConstructor
public class AiChatIntentExtractor {

    private static final DateTimeFormatter ISO_LOCAL = DateTimeFormatter.ISO_LOCAL_DATE_TIME;

    private final GeminiAiClient geminiAiClient;
    private final ObjectMapper objectMapper;

    public ChatIntent extract(AiChatRequest request) {
        String originalMessage = request.getMessage().trim();
        String normalizedMessage = AiChatText.normalize(originalMessage);
        LocalDateTime now = LocalDateTime.now();

        try {
            String raw = geminiAiClient.chat(
                    buildSystemPrompt(),
                    buildUserPrompt(originalMessage, now, request),
                    0.1,
                    500
            );

            JsonNode root = objectMapper.readTree(stripCodeFence(raw));
            Integer people = readPeople(root.get("people"));
            BigDecimal maxPrice = readMoney(root.get("maxPricePerHour"));
            ChatTimeRange timeRange = readTimeRange(root);
            List<String> equipment = readEquipment(root.get("equipmentKeywords"));
            String requestedRoomName = textOrNull(root.get("requestedRoomName"));
            String category = textOrNull(root.get("category"));

            return new ChatIntent(
                    originalMessage,
                    normalizedMessage,
                    people,
                    maxPrice,
                    timeRange,
                    equipment,
                    requestedRoomName,
                    category,
                    "AI"
            );
        } catch (RuntimeException | java.io.IOException exception) {
            throw new IllegalStateException("Failed to extract chatbot intent from AI", exception);
        }
    }

    private String buildSystemPrompt() {
        return """
                Extract booking intent from a Vietnamese customer message for a band rehearsal room studio.
                You receive recent conversation history for continuity.
                Return ONLY valid JSON, no markdown, no explanation.
                JSON schema:
                {
                  "people": number|null,
                  "maxPricePerHour": number|null,
                  "startTime": "yyyy-MM-dd'T'HH:mm:ss"|null,
                  "endTime": "yyyy-MM-dd'T'HH:mm:ss"|null,
                  "equipmentKeywords": ["mic"|"drum"|"amp"|"mixer"|"guitar"|"keyboard"],
                  "requestedRoomName": string|null,
                  "category": "ROOM_SEARCH"|"ROOM_LOOKUP"|"GREETING"|"OPENING_HOURS"|"BOOKING_GUIDE"|"PAYMENT"|"CANCELLATION"|"COUPON"|"CONTACT"|"OTHER"
                }
                Rules:
                - Understand the LATEST customer message in context of recent conversation.
                - Carry forward people / budget / time / equipment from earlier turns when the latest message omits them but clearly continues the same search (e.g. "phòng khác", "còn không", "rẻ hơn", "thế còn phòng nào").
                - "8ng", "8 ng", "cho 8", "band 8 người" => people=8
                - "duoi 300k", "toi da 300 ngan" => maxPricePerHour=300000
                - "phòng ssssss", "xem phòng A1", "phòng 12ewwq thì sao" => requestedRoomName is that room token, category=ROOM_LOOKUP
                - Do NOT set requestedRoomName for generic phrases like "phòng nào", "phòng cho 8 người", "phòng rẻ"
                - "tư vấn phòng khác", "phòng loại khác", "ý tôi là tìm phòng loại khác", "còn phòng nào khác" => requestedRoomName=null, category=ROOM_SEARCH
                - Never use Vietnamese function words as room names: khác, loại, nào, cho, rẻ, tốt, ...
                - Pronouns / short follow-ups ("còn không", "cái khác đi", "ok còn nữa") inherit prior filters.
                - Use absolute local datetimes based on provided current time.
                - "toi nay 18h-20h" => tonight 18:00-20:00
                - "toi nay" without hour => tonight 18:00-22:00
                - "sang mai" => tomorrow 08:00-12:00
                - "buoi chieu" => today/requested day 13:00-17:00
                - If only one start hour is given, assume 2-hour duration.
                - equipmentKeywords only from the allowed list.
                - If unknown, use null or [].
                """;
    }

    private String buildUserPrompt(String message, LocalDateTime now, AiChatRequest request) {
        return """
                Current local datetime: %s
                Today date: %s
                Recent conversation (oldest → newest, excluding current message):
                %s
                Latest customer message: %s
                """.formatted(
                now.format(ISO_LOCAL),
                LocalDate.now(),
                ChatHistorySupport.formatForPrompt(request.getHistory()),
                message
        );
    }

    private String stripCodeFence(String raw) {
        String trimmed = raw.trim();
        if (trimmed.startsWith("```")) {
            int firstNewline = trimmed.indexOf('\n');
            int lastFence = trimmed.lastIndexOf("```");
            if (firstNewline > 0 && lastFence > firstNewline) {
                return trimmed.substring(firstNewline + 1, lastFence).trim();
            }
        }
        return trimmed;
    }

    private Integer readPeople(JsonNode node) {
        if (node == null || node.isNull() || !node.isNumber()) {
            return null;
        }
        int people = node.asInt();
        return people >= 1 && people <= 50 ? people : null;
    }

    private BigDecimal readMoney(JsonNode node) {
        if (node == null || node.isNull() || !node.isNumber()) {
            return null;
        }
        BigDecimal value = node.decimalValue();
        return value.compareTo(BigDecimal.ZERO) > 0 ? value : null;
    }

    private ChatTimeRange readTimeRange(JsonNode root) {
        LocalDateTime start = parseDateTime(textOrNull(root.get("startTime")));
        LocalDateTime end = parseDateTime(textOrNull(root.get("endTime")));
        if (start == null || end == null || !start.isBefore(end)) {
            return null;
        }
        return new ChatTimeRange(start, end);
    }

    private LocalDateTime parseDateTime(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        try {
            String normalized = value.trim().replace(' ', 'T');
            if (normalized.length() == 16) {
                normalized = normalized + ":00";
            }
            return LocalDateTime.parse(normalized, ISO_LOCAL);
        } catch (RuntimeException ignored) {
            try {
                LocalTime time = LocalTime.parse(value.trim());
                LocalDateTime start = LocalDateTime.of(LocalDate.now(), time);
                if (time.isBefore(LocalTime.now())) {
                    start = start.plusDays(1);
                }
                return start;
            } catch (RuntimeException ignoredAgain) {
                return null;
            }
        }
    }

    private List<String> readEquipment(JsonNode node) {
        if (node == null || !node.isArray()) {
            return List.of();
        }
        List<String> keywords = new ArrayList<>();
        node.forEach(item -> {
            if (item != null && item.isTextual()) {
                String value = item.asText().trim().toLowerCase(Locale.ROOT);
                if (List.of("mic", "drum", "amp", "mixer", "guitar", "keyboard").contains(value)
                        && !keywords.contains(value)) {
                    keywords.add(value);
                }
            }
        });
        return keywords;
    }

    private String textOrNull(JsonNode node) {
        if (node == null || node.isNull() || !node.isTextual()) {
            return null;
        }
        String value = node.asText().trim();
        return value.isBlank() ? null : value;
    }
}
