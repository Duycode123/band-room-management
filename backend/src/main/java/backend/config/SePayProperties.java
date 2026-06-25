package backend.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

@Getter
@Setter
@Component
@ConfigurationProperties(prefix = "payment.sepay")
public class SePayProperties {

    private String environment = "sandbox";
    private String checkoutUrl;
    private String merchantId;
    private String secretKey;
    private String successUrl;
    private String errorUrl;
    private String cancelUrl;
    private String ipnSecret;
    private String operation = "PURCHASE";
    private String method = "BANK_TRANSFER";
    private String transactionType = "PAYMENT";
    private String currency = "VND";

    public String resolveCheckoutUrl() {
        if (StringUtils.hasText(checkoutUrl)) {
            return checkoutUrl.trim();
        }

        String normalizedEnvironment = environment == null
                ? "sandbox"
                : environment.trim().toLowerCase();

        return switch (normalizedEnvironment) {
            case "production", "prod" -> "https://pay.sepay.vn/v1/checkout/init";
            case "sandbox", "test" -> "https://pay-sandbox.sepay.vn/v1/checkout/init";
            default -> throw new IllegalStateException("payment.sepay.environment khong hop le: " + environment);
        };
    }
}
