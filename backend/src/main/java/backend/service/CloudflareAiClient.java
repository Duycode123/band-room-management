package backend.service;

import backend.config.CloudflareAiProperties;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class CloudflareAiClient {

    private final CloudflareAiProperties properties;
    private final RestClient.Builder restClientBuilder;

    public boolean isConfigured() {
        return properties.isConfigured();
    }

    public String getModel() {
        return properties.getModel();
    }

    public String chat(String systemPrompt, String userPrompt) {
        Map<String, Object> body = Map.of(
                "model", properties.getModel(),
                "messages", List.of(
                        Map.of("role", "system", "content", systemPrompt),
                        Map.of("role", "user", "content", userPrompt)
                ),
                "max_tokens", properties.getMaxTokens(),
                "temperature", properties.getTemperature()
        );

        Map<?, ?> response = restClientBuilder
                .baseUrl(properties.getBaseUrl())
                .build()
                .post()
                .uri("/accounts/{accountId}/ai/v1/chat/completions", properties.getAccountId())
                .headers(headers -> headers.setBearerAuth(properties.getApiToken()))
                .contentType(MediaType.APPLICATION_JSON)
                .accept(MediaType.APPLICATION_JSON)
                .body(body)
                .retrieve()
                .body(Map.class);

        return extractAnswer(response);
    }

    private String extractAnswer(Map<?, ?> response) {
        if (response == null) {
            throw new IllegalStateException("Cloudflare AI returned an empty response");
        }

        Object choicesObject = response.get("choices");
        if (!(choicesObject instanceof List<?> choices) || choices.isEmpty()) {
            Object errors = response.get("errors");
            throw new IllegalStateException("Cloudflare AI response has no choices: " + errors);
        }

        Object firstChoice = choices.get(0);
        if (!(firstChoice instanceof Map<?, ?> choice)) {
            throw new IllegalStateException("Cloudflare AI choice format is invalid");
        }

        Object messageObject = choice.get("message");
        if (messageObject instanceof Map<?, ?> message && message.get("content") instanceof String content) {
            return content.trim();
        }

        if (choice.get("text") instanceof String text) {
            return text.trim();
        }

        throw new IllegalStateException("Cloudflare AI answer format is invalid");
    }
}
