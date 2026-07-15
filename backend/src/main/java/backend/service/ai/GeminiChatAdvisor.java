package backend.service.ai;

import backend.dto.request.AiChatHistoryMessage;
import backend.dto.response.AiSuggestedRoomResponse;
import backend.service.GeminiAiClient;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.Objects;

@Component
@RequiredArgsConstructor
public class GeminiChatAdvisor {

    private final GeminiAiClient geminiAiClient;
    private final LocalChatAnswerBuilder localChatAnswerBuilder;

    public record Advice(String answer, String mode, boolean usedAi) {
    }

    public Advice advise(
            ChatIntent intent,
            List<AiSuggestedRoomResponse> matchedRooms,
            List<AiSuggestedRoomResponse> allRooms,
            String localAnswer,
            List<AiChatHistoryMessage> history,
            List<Integer> excludeRoomIds
    ) {
        // Prefer Gemini for natural answers. Local answer is grounding + offline fallback only —
        // not a hard override that replaces the model for ranking/price/name questions.
        if (!geminiAiClient.isConfigured()) {
            return new Advice(localAnswer, "LOCAL_DB_RULES", false);
        }

        try {
            String aiAnswer = geminiAiClient.chat(
                    buildSystemPrompt(),
                    buildGeminiPrompt(intent, matchedRooms, allRooms, localAnswer, history, excludeRoomIds)
            );
            if (AiChatText.isLikelyIncompleteAnswer(aiAnswer)) {
                return new Advice(localAnswer, "LOCAL_DB_RULES:GEMINI_INCOMPLETE", false);
            }
            if (isClearlyUngrounded(intent, matchedRooms, aiAnswer)) {
                return new Advice(localAnswer, "LOCAL_DB_RULES:GEMINI_UNGROUNDED", false);
            }
            return new Advice(aiAnswer, "GEMINI_GROUNDED:" + geminiAiClient.getModel(), true);
        } catch (RuntimeException ignored) {
            return new Advice(localAnswer, "LOCAL_DB_RULES", false);
        }
    }

    private String buildSystemPrompt() {
        return """
                You are BandBot for BandHub Studio (band room booking).
                Answer in natural Vietnamese, no markdown tables.
                You are the customer-facing voice: write freely and conversationally.
                Facts (rooms, prices, ratings, capacity, equipment, availability, policy) come ONLY from the provided context.
                Hard grounding rules:
                1) If people is set, NEVER recommend a room with smaller capacity.
                2) If max price is set, NEVER recommend a more expensive room as the main pick.
                3) If Matched rooms is non-empty, MAIN recommendation MUST come from Matched rooms.
                4) Rooms failing filters may only be mentioned as not matching, never as top pick.
                5) Understand slang: "8ng" = 8 people; "duoi 300k" = budget; "toi nay 18h-20h" = time window.
                6) Vary wording; do not always start with "Mình gợi ý".
                7) Answer the exact question first, then one next-step suggestion.
                8) Never invent rooms, prices, coupons, ratings, or availability.
                9) If requestedRoomName is set and Matched rooms is empty: clearly say that room name was not found. Do NOT recommend random rooms as if they were the answer. You may briefly list 1-3 existing room names only as alternatives to try typing correctly.
                10) If requestedRoomName is set and Matched rooms is non-empty: answer about those named rooms only.
                11) Phrases like "phòng khác", "loại khác", "tư vấn phòng khác" mean recommend other/available rooms, NOT a room named "khác"/"loại".
                12) Use recent conversation only for continuity (pronouns, prior filters, what was already suggested). Never invent facts from history.
                13) Prefer rooms that were NOT already suggested when the customer asks for alternatives.
                14) If category is TOP_RATED or the question asks for the highest-rated room: lead with the top room(s) by averageRating from Matched rooms / Grounded facts. If no room has approved reviews, say ratings are not available yet. Do NOT invent star ratings.
                15) If the question asks for the cheapest room: lead with the lowest pricePerHour room from the provided lists. Do NOT promote a more expensive room as cheapest.
                16) "Grounded facts from database" is verified evidence — keep those conclusions about names/prices/ratings. You may rephrase freely, but do not change which room wins or invent values.
                """;
    }

    private String buildGeminiPrompt(
            ChatIntent intent,
            List<AiSuggestedRoomResponse> matchedRooms,
            List<AiSuggestedRoomResponse> allRooms,
            String groundedFacts,
            List<AiChatHistoryMessage> history,
            List<Integer> excludeRoomIds
    ) {
        StringBuilder prompt = new StringBuilder();
        prompt.append("Recent conversation (oldest → newest):\n");
        prompt.append(ChatHistorySupport.formatForPrompt(history)).append("\n\n");
        prompt.append("Customer message: ").append(intent.originalMessage()).append("\n\n");
        prompt.append("Current system time: ").append(AiChatText.formatTime(LocalDateTime.now())).append("\n\n");
        prompt.append("Interpreted filters:\n");
        prompt.append("- intent source: ").append(intent.source()).append("\n");
        prompt.append("- category: ").append(intent.category() == null ? "unknown" : intent.category()).append("\n");
        prompt.append("- people: ").append(intent.people() == null ? "unknown" : intent.people()).append("\n");
        prompt.append("- max price per hour: ")
                .append(intent.maxPricePerHour() == null ? "unknown" : AiChatText.formatMoney(intent.maxPricePerHour()))
                .append("\n");
        prompt.append("- equipment keywords: ")
                .append(intent.equipmentKeywords() == null || intent.equipmentKeywords().isEmpty()
                        ? "none"
                        : String.join(", ", intent.equipmentKeywords()))
                .append("\n");
        prompt.append("- requested room name: ")
                .append(intent.hasRequestedRoomName() ? intent.requestedRoomName() : "none")
                .append("\n");
        prompt.append("- previously suggested room ids to avoid repeating: ")
                .append(excludeRoomIds == null || excludeRoomIds.isEmpty()
                        ? "none"
                        : excludeRoomIds.stream().map(String::valueOf).reduce((a, b) -> a + ", " + b).orElse("none"))
                .append("\n");
        prompt.append("- requested time: ");
        if (intent.timeRange() == null) {
            prompt.append("unknown\n\n");
        } else {
            prompt.append(AiChatText.formatTime(intent.timeRange().startTime()))
                    .append(" to ")
                    .append(AiChatText.formatTime(intent.timeRange().endTime()))
                    .append("\n\n");
        }

        prompt.append("Business policy context:\n");
        prompt.append("- Opening hours: 08:00-24:00 daily.\n");
        prompt.append("- Booking flow: choose room -> choose time -> confirm -> pay online in full via bank transfer.\n");
        prompt.append("- Cancellation: customer can cancel at least 24 hours before start.\n");
        prompt.append("- Coupon is validated at checkout only.\n");
        prompt.append("- MAINTENANCE rooms are not bookable.\n\n");
        prompt.append("Active coupon context:\n");
        prompt.append(localChatAnswerBuilder.buildCouponContext()).append("\n\n");
        prompt.append("Privacy rule: never reveal another customer's personal or booking details.\n\n");

        prompt.append("Matched rooms to prioritize (already filtered/sorted for this question):\n");
        appendRoomContext(prompt, matchedRooms);
        if (intent.hasRequestedRoomName() && matchedRooms.isEmpty()) {
            prompt.append("\nIMPORTANT: Customer asked for room name \"")
                    .append(intent.requestedRoomName())
                    .append("\" but it was NOT found. Say not found. Do not pretend another room is that name.\n");
        } else if (!matchedRooms.isEmpty()) {
            prompt.append("\nIMPORTANT: Primary recommendation must be from Matched rooms above.\n");
        } else {
            prompt.append("\nIMPORTANT: No matched rooms. Explain missing condition and suggest closest alternatives carefully.\n");
        }
        prompt.append("\nAll room context from database (comparison only):\n");
        appendRoomContext(prompt, allRooms);
        prompt.append("\nGrounded facts from database (verified — keep conclusions, rephrase wording freely):\n");
        prompt.append(groundedFacts).append("\n\n");
        if (intent.hasRequestedRoomName() && matchedRooms.isEmpty()) {
            prompt.append("Write the final customer-facing answer now. Confirm the room name was not found.");
        } else {
            prompt.append("Write the final customer-facing answer now. Keep continuity with the conversation. Mention 1-3 best MATCHING rooms when useful.");
        }
        return prompt.toString();
    }

    /**
     * Soft guard: if Gemini clearly ignores the DB ranking/price winner, fall back to local facts.
     * Does not skip Gemini up-front — only rejects obviously ungrounded rewrites.
     */
    boolean isClearlyUngrounded(
            ChatIntent intent,
            List<AiSuggestedRoomResponse> matchedRooms,
            String aiAnswer
    ) {
        if (aiAnswer == null || aiAnswer.isBlank() || matchedRooms == null || matchedRooms.isEmpty()) {
            return false;
        }

        String message = intent.normalizedMessage();
        boolean topRated = "TOP_RATED".equals(intent.category())
                || RoomNameIntentGuard.isAskingHighestRated(message);
        if (topRated) {
            return matchedRooms.stream()
                    .filter(room -> room.getAverageRating() != null
                            && room.getApprovedReviewCount() != null
                            && room.getApprovedReviewCount() > 0)
                    .max(Comparator.comparing(AiSuggestedRoomResponse::getAverageRating)
                            .thenComparing(AiSuggestedRoomResponse::getApprovedReviewCount))
                    .map(AiSuggestedRoomResponse::getRoomName)
                    .filter(Objects::nonNull)
                    .map(String::trim)
                    .filter(name -> !name.isEmpty())
                    .map(winner -> !containsIgnoreCase(aiAnswer, winner))
                    .orElse(false);
        }

        if (isAskingCheapest(message)) {
            return matchedRooms.stream()
                    .filter(room -> room.getPricePerHour() != null)
                    .min(Comparator.comparing(AiSuggestedRoomResponse::getPricePerHour)
                            .thenComparing(room -> room.getRoomId() == null ? Integer.MAX_VALUE : room.getRoomId()))
                    .map(AiSuggestedRoomResponse::getRoomName)
                    .filter(Objects::nonNull)
                    .map(String::trim)
                    .filter(name -> !name.isEmpty())
                    .map(winner -> !containsIgnoreCase(aiAnswer, winner))
                    .orElse(false);
        }

        return false;
    }

    private static boolean isAskingCheapest(String normalizedMessage) {
        return normalizedMessage != null
                && (normalizedMessage.contains("re nhat") || normalizedMessage.contains("gia thap nhat"));
    }

    private static boolean containsIgnoreCase(String haystack, String needle) {
        return haystack.toLowerCase(Locale.ROOT).contains(needle.toLowerCase(Locale.ROOT));
    }

    private void appendRoomContext(StringBuilder prompt, List<AiSuggestedRoomResponse> rooms) {
        if (rooms.isEmpty()) {
            prompt.append("- none\n");
            return;
        }

        rooms.stream().limit(20).forEach(room -> prompt.append("- ")
                .append("id=").append(room.getRoomId())
                .append(" | name=").append(room.getRoomName())
                .append(" | type=").append(room.getRoomTypeName())
                .append(" | typeDescription=").append(AiChatText.blankToUnknown(room.getRoomTypeDescription()))
                .append(" | price=").append(AiChatText.formatMoney(room.getPricePerHour()))
                .append("/hour | capacity=")
                .append(room.getCapacity() == null ? "unknown" : room.getCapacity())
                .append(" | status=").append(room.getStatus())
                .append(" | averageRating=").append(AiChatText.formatRating(room))
                .append(" | equipment=").append(AiChatText.blankToUnknown(room.getEquipmentSummary()))
                .append(" | unavailableEquipment=").append(AiChatText.blankToUnknown(room.getUnavailableEquipmentSummary()))
                .append(" | availableInRequestedTime=")
                .append(room.getAvailableInRequestedTime() == null ? "unknown" : room.getAvailableInRequestedTime())
                .append(" | reason=").append(room.getReason())
                .append("\n"));
    }
}
