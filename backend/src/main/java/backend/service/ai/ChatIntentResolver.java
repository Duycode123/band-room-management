package backend.service.ai;

import backend.dto.request.AiChatRequest;
import backend.service.GeminiAiClient;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

@Component
@RequiredArgsConstructor
public class ChatIntentResolver {

    private final ChatIntentParser chatIntentParser;
    private final AiChatIntentExtractor aiChatIntentExtractor;
    private final GeminiAiClient geminiAiClient;

    public ChatIntent resolve(AiChatRequest request) {
        ChatIntent regexIntent = enrichFromHistory(chatIntentParser.parse(request), request);

        if (!geminiAiClient.isConfigured()) {
            return regexIntent;
        }

        try {
            ChatIntent aiIntent = aiChatIntentExtractor.extract(request);
            return merge(request, aiIntent, regexIntent);
        } catch (RuntimeException ignored) {
            return regexIntent;
        }
    }

    private ChatIntent merge(AiChatRequest request, ChatIntent aiIntent, ChatIntent regexIntent) {
        Integer people = firstNonNull(request.getPeople(), aiIntent.people(), regexIntent.people());
        BigDecimal maxPrice = firstNonNull(
                request.getMaxPricePerHour(),
                aiIntent.maxPricePerHour(),
                regexIntent.maxPricePerHour()
        );

        ChatTimeRange timeRange;
        if (request.getStartTime() != null && request.getEndTime() != null) {
            timeRange = new ChatTimeRange(request.getStartTime(), request.getEndTime());
        } else {
            timeRange = firstNonNull(aiIntent.timeRange(), regexIntent.timeRange());
        }

        List<String> equipment = mergeEquipment(aiIntent.equipmentKeywords(), regexIntent.equipmentKeywords());
        String requestedRoomName = resolveRequestedRoomName(aiIntent, regexIntent);
        String category = firstNonNull(aiIntent.category(), regexIntent.category());
        if (RoomNameIntentGuard.isAskingHighestRated(regexIntent.normalizedMessage())) {
            requestedRoomName = null;
            category = "TOP_RATED";
        } else if (RoomNameIntentGuard.isAskingOtherRooms(regexIntent.normalizedMessage())) {
            requestedRoomName = null;
            if (category == null || "ROOM_LOOKUP".equals(category) || "OTHER".equals(category)) {
                category = "ROOM_SEARCH";
            }
        } else if (requestedRoomName != null && category == null) {
            category = "ROOM_LOOKUP";
        }
        String source = "AI+REGEX";

        return new ChatIntent(
                regexIntent.originalMessage(),
                regexIntent.normalizedMessage(),
                people,
                maxPrice,
                timeRange,
                equipment,
                requestedRoomName,
                category,
                source
        );
    }

    /**
     * When the latest turn is a short follow-up ("phòng khác"), inherit people/budget/time
     * from earlier user messages via the same regex parser.
     */
    private ChatIntent enrichFromHistory(ChatIntent current, AiChatRequest request) {
        String priorUserText = ChatHistorySupport.priorUserText(request.getHistory());
        if (priorUserText.isBlank()) {
            return current;
        }

        AiChatRequest priorRequest = new AiChatRequest();
        priorRequest.setMessage(priorUserText);
        ChatIntent prior = chatIntentParser.parse(priorRequest);

        boolean followUp = RoomNameIntentGuard.isAskingOtherRooms(current.normalizedMessage())
                || current.normalizedMessage().matches(".*(con khong|con nua|cai khac|the thi|ok|tiep)\\b.*")
                || (current.people() == null
                && current.maxPricePerHour() == null
                && current.timeRange() == null
                && !current.hasRequestedRoomName()
                && current.normalizedMessage().length() <= 40);

        if (!followUp) {
            return current;
        }

        return new ChatIntent(
                current.originalMessage(),
                current.normalizedMessage(),
                firstNonNull(current.people(), prior.people()),
                firstNonNull(current.maxPricePerHour(), prior.maxPricePerHour()),
                firstNonNull(current.timeRange(), prior.timeRange()),
                current.hasEquipmentFilter() ? current.equipmentKeywords() : prior.equipmentKeywords(),
                current.requestedRoomName(),
                current.category() != null ? current.category()
                        : (RoomNameIntentGuard.isAskingOtherRooms(current.normalizedMessage()) ? "ROOM_SEARCH" : null),
                current.source()
        );
    }

    private String resolveRequestedRoomName(ChatIntent aiIntent, ChatIntent regexIntent) {
        if (RoomNameIntentGuard.isAskingOtherRooms(regexIntent.normalizedMessage())) {
            return null;
        }
        String fromRegex = RoomNameIntentGuard.sanitizeRequestedRoomName(regexIntent.requestedRoomName());
        String fromAi = RoomNameIntentGuard.sanitizeRequestedRoomName(aiIntent.requestedRoomName());
        return firstNonNull(fromRegex, fromAi);
    }

    private List<String> mergeEquipment(List<String> first, List<String> second) {
        Set<String> merged = new LinkedHashSet<>();
        if (first != null) {
            merged.addAll(first);
        }
        if (second != null) {
            merged.addAll(second);
        }
        return new ArrayList<>(merged);
    }

    @SafeVarargs
    private final <T> T firstNonNull(T... values) {
        for (T value : values) {
            if (value != null) {
                return value;
            }
        }
        return null;
    }
}
