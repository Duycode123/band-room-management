package backend.service.impl;

import backend.dto.request.AiChatRequest;
import backend.dto.response.AiChatResponse;
import backend.dto.response.AiSuggestedRoomResponse;
import backend.service.AiConsultantService;
import backend.service.ai.ChatIntent;
import backend.service.ai.ChatIntentResolver;
import backend.service.ai.GeminiChatAdvisor;
import backend.service.ai.LocalChatAnswerBuilder;
import backend.service.ai.RoomNameIntentGuard;
import backend.service.ai.RoomRecommendationService;
import backend.service.ai.SuggestedQuestionsProvider;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class AiConsultantServiceImpl implements AiConsultantService {

    private final ChatIntentResolver chatIntentResolver;
    private final RoomRecommendationService roomRecommendationService;
    private final LocalChatAnswerBuilder localChatAnswerBuilder;
    private final GeminiChatAdvisor geminiChatAdvisor;
    private final SuggestedQuestionsProvider suggestedQuestionsProvider;

    @Override
    @Transactional(readOnly = true)
    public AiChatResponse chat(AiChatRequest request) {
        // 1) Understand question with conversation continuity
        ChatIntent intent = chatIntentResolver.resolve(request);

        // 2) Facts from DB — filter by interpreted slots
        List<AiSuggestedRoomResponse> allAvailableRooms =
                roomRecommendationService.findAvailableRooms(intent.timeRange());
        List<AiSuggestedRoomResponse> matchedRooms = resolveMatchedRooms(intent, allAvailableRooms);

        boolean askingOtherRooms = RoomNameIntentGuard.isAskingOtherRooms(intent.normalizedMessage());
        if (askingOtherRooms) {
            matchedRooms = excludePreviouslySuggested(matchedRooms, request.getExcludeRoomIds());
            if (matchedRooms.isEmpty()) {
                matchedRooms = excludePreviouslySuggested(allAvailableRooms, request.getExcludeRoomIds());
            }
        }

        // 3) Deterministic local answer from filtered DB data
        String localAnswer = localChatAnswerBuilder.build(intent, matchedRooms, allAvailableRooms);

        // 4) AI writes natural reply grounded on matched rooms + chat continuity
        GeminiChatAdvisor.Advice advice = geminiChatAdvisor.advise(
                intent,
                matchedRooms,
                allAvailableRooms,
                localAnswer,
                request.getHistory(),
                request.getExcludeRoomIds()
        );

        String mode = advice.mode();
        if (advice.usedAi()) {
            mode = mode + "|INTENT:" + intent.source();
        } else if ("AI+REGEX".equals(intent.source()) || "AI".equals(intent.source())) {
            mode = "LOCAL_DB_RULES|INTENT:" + intent.source();
        }

        return AiChatResponse.builder()
                .answer(advice.answer())
                .suggestedRooms(matchedRooms)
                .interpretedStartTime(intent.timeRange() == null ? null : intent.timeRange().startTime())
                .interpretedEndTime(intent.timeRange() == null ? null : intent.timeRange().endTime())
                .interpretedPeople(intent.people())
                .suggestedQuestions(getSuggestedQuestions())
                .usedAi(advice.usedAi())
                .mode(mode)
                .build();
    }

    private List<AiSuggestedRoomResponse> resolveMatchedRooms(
            ChatIntent intent,
            List<AiSuggestedRoomResponse> allAvailableRooms
    ) {
        if (intent.hasRequestedRoomName()) {
            List<AiSuggestedRoomResponse> byName = roomRecommendationService.findRoomsByName(
                    allAvailableRooms,
                    intent.requestedRoomName()
            );
            List<AiSuggestedRoomResponse> matchedRooms = roomRecommendationService.filterRooms(
                    byName,
                    intent.people(),
                    intent.maxPricePerHour(),
                    intent.timeRange(),
                    intent.equipmentKeywords()
            );
            if (byName.isEmpty()) {
                return List.of();
            }
            return matchedRooms.isEmpty() ? byName : matchedRooms;
        }

        return roomRecommendationService.filterRooms(
                allAvailableRooms,
                intent.people(),
                intent.maxPricePerHour(),
                intent.timeRange(),
                intent.equipmentKeywords()
        );
    }

    private List<AiSuggestedRoomResponse> excludePreviouslySuggested(
            List<AiSuggestedRoomResponse> rooms,
            List<Integer> excludeRoomIds
    ) {
        if (excludeRoomIds == null || excludeRoomIds.isEmpty() || rooms.isEmpty()) {
            return rooms;
        }
        Set<Integer> excluded = new HashSet<>(excludeRoomIds);
        return rooms.stream()
                .filter(room -> room.getRoomId() == null || !excluded.contains(room.getRoomId()))
                .toList();
    }

    @Override
    public List<String> getSuggestedQuestions() {
        return suggestedQuestionsProvider.getSuggestedQuestions();
    }
}
