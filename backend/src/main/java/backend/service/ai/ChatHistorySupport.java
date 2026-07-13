package backend.service.ai;

import backend.dto.request.AiChatHistoryMessage;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

final class ChatHistorySupport {

    private static final int MAX_TURNS = 8;
    private static final int MAX_CONTENT_CHARS = 400;

    private ChatHistorySupport() {
    }

    static List<AiChatHistoryMessage> normalize(List<AiChatHistoryMessage> history) {
        if (history == null || history.isEmpty()) {
            return List.of();
        }
        List<AiChatHistoryMessage> cleaned = new ArrayList<>();
        for (AiChatHistoryMessage item : history) {
            if (item == null || item.getRole() == null || item.getContent() == null) {
                continue;
            }
            String role = item.getRole().trim().toLowerCase(Locale.ROOT);
            if (!role.equals("user") && !role.equals("assistant")) {
                continue;
            }
            String content = item.getContent().trim();
            if (content.isBlank()) {
                continue;
            }
            if (content.length() > MAX_CONTENT_CHARS) {
                content = content.substring(0, MAX_CONTENT_CHARS) + "…";
            }
            AiChatHistoryMessage copy = new AiChatHistoryMessage();
            copy.setRole(role);
            copy.setContent(content);
            cleaned.add(copy);
        }
        if (cleaned.size() <= MAX_TURNS) {
            return cleaned;
        }
        return cleaned.subList(cleaned.size() - MAX_TURNS, cleaned.size());
    }

    static String formatForPrompt(List<AiChatHistoryMessage> history) {
        List<AiChatHistoryMessage> turns = normalize(history);
        if (turns.isEmpty()) {
            return "(no prior turns)";
        }
        StringBuilder builder = new StringBuilder();
        for (AiChatHistoryMessage turn : turns) {
            builder.append(turn.getRole())
                    .append(": ")
                    .append(turn.getContent())
                    .append('\n');
        }
        return builder.toString().trim();
    }

    static String priorUserText(List<AiChatHistoryMessage> history) {
        List<AiChatHistoryMessage> turns = normalize(history);
        StringBuilder builder = new StringBuilder();
        for (AiChatHistoryMessage turn : turns) {
            if ("user".equals(turn.getRole())) {
                if (!builder.isEmpty()) {
                    builder.append(' ');
                }
                builder.append(turn.getContent());
            }
        }
        return builder.toString().trim();
    }
}
