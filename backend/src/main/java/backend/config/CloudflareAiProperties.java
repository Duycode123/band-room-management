package backend.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Component
@ConfigurationProperties(prefix = "cloudflare.ai")
public class CloudflareAiProperties {

    private String accountId;
    private String apiToken;
    private String model = "@cf/meta/llama-3.1-8b-instruct-fast";
    private String baseUrl = "https://api.cloudflare.com/client/v4";
    private int maxTokens = 700;
    private double temperature = 0.25;

    public boolean isConfigured() {
        return hasText(accountId) && hasText(apiToken) && hasText(model);
    }

    public String getAccountId() {
        return accountId;
    }

    public void setAccountId(String accountId) {
        this.accountId = accountId;
    }

    public String getApiToken() {
        return apiToken;
    }

    public void setApiToken(String apiToken) {
        this.apiToken = apiToken;
    }

    public String getModel() {
        return model;
    }

    public void setModel(String model) {
        this.model = model;
    }

    public String getBaseUrl() {
        return baseUrl;
    }

    public void setBaseUrl(String baseUrl) {
        this.baseUrl = baseUrl;
    }

    public int getMaxTokens() {
        return maxTokens;
    }

    public void setMaxTokens(int maxTokens) {
        this.maxTokens = maxTokens;
    }

    public double getTemperature() {
        return temperature;
    }

    public void setTemperature(double temperature) {
        this.temperature = temperature;
    }

    private boolean hasText(String value) {
        return value != null && !value.isBlank();
    }
}
