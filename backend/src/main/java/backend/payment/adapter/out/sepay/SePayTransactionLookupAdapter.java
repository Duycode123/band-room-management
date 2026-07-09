package backend.payment.adapter.out.sepay;

import backend.config.SePayProperties;
import backend.payment.application.port.out.FindSePayIncomingPaymentPort;
import backend.payment.application.port.out.model.SePayIncomingPayment;
import backend.payment.application.port.out.model.SePayIncomingPaymentQuery;
import com.fasterxml.jackson.databind.JsonNode;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;
import org.springframework.web.util.UriComponentsBuilder;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.net.URI;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.Optional;

@Component
@RequiredArgsConstructor
public class SePayTransactionLookupAdapter implements FindSePayIncomingPaymentPort {

    private static final Logger log = LoggerFactory.getLogger(SePayTransactionLookupAdapter.class);
    private static final String SEPAY_TRANSACTIONS_URL = "https://my.sepay.vn/userapi/transactions/list";
    private static final DateTimeFormatter SEPAY_DATE_TIME_FORMATTER =
            DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    private final SePayProperties sePayProperties;
    private final RestClient restClient = RestClient.create();

    @Override
    public Optional<SePayIncomingPayment> findIncomingPayment(SePayIncomingPaymentQuery query) {
        String accessToken = blankToNull(sePayProperties.getApiAccessToken());
        if (accessToken == null) {
            return Optional.empty();
        }

        try {
            JsonNode response = restClient.get()
                    .uri(buildTransactionsUri(query))
                    .header("Authorization", "Bearer " + accessToken)
                    .retrieve()
                    .body(JsonNode.class);

            return findMatchingTransaction(response, query);
        } catch (RestClientException | IllegalArgumentException exception) {
            log.warn("Cannot query SePay transactions for payment {}", query.paymentReference(), exception);
            return Optional.empty();
        }
    }

    private URI buildTransactionsUri(SePayIncomingPaymentQuery query) {
        UriComponentsBuilder uriBuilder = UriComponentsBuilder
                .fromHttpUrl(SEPAY_TRANSACTIONS_URL)
                .queryParam("amount_in", toVndInteger(query.expectedAmount()))
                .queryParam("transaction_date_min", query.fromDate())
                .queryParam("transaction_date_max", query.toDate())
                .queryParam("limit", 20);

        String accountNumber = resolveAccountNumber();
        if (accountNumber != null) {
            uriBuilder.queryParam("account_number", accountNumber);
        }

        return uriBuilder.build(true).toUri();
    }

    private Optional<SePayIncomingPayment> findMatchingTransaction(JsonNode response, SePayIncomingPaymentQuery query) {
        JsonNode transactions = response == null ? null : response.path("transactions");
        if (transactions == null || !transactions.isArray()) {
            return Optional.empty();
        }

        for (JsonNode item : transactions) {
            if (!matchesConfiguredBankAccount(item)) {
                continue;
            }

            BigDecimal amountIn = amount(item.path("amount_in"));
            if (amountIn == null || amountIn.compareTo(query.expectedAmount().setScale(2, RoundingMode.HALF_UP)) < 0) {
                continue;
            }

            String code = text(item.path("code"));
            String content = text(item.path("transaction_content"));
            if (!matchesReference(query.paymentReference(), code, content)) {
                continue;
            }

            LocalDateTime transactionDate = parseTransactionDate(text(item.path("transaction_date")));
            if (transactionDate != null && query.createdAt() != null && transactionDate.isBefore(query.createdAt().minusMinutes(1))) {
                continue;
            }

            return Optional.of(new SePayIncomingPayment(
                    text(item.path("id")),
                    amountIn,
                    content,
                    code,
                    transactionDate
            ));
        }

        return Optional.empty();
    }

    private boolean matchesConfiguredBankAccount(JsonNode item) {
        String configuredBankAccountId = blankToNull(sePayProperties.getApiBankAccountId());
        if (configuredBankAccountId != null) {
            String actualBankAccountId = text(item.path("bank_account_id"));
            if (!configuredBankAccountId.equals(actualBankAccountId)) {
                return false;
            }
        }

        String configuredAccountNumber = resolveAccountNumber();
        if (configuredAccountNumber != null) {
            String actualAccountNumber = text(item.path("account_number"));
            return configuredAccountNumber.equals(actualAccountNumber);
        }

        return true;
    }

    private boolean matchesReference(String paymentReference, String code, String content) {
        String normalizedReference = normalize(paymentReference);
        return normalizedReference.equals(normalize(code))
                || normalize(content).contains(normalizedReference);
    }

    private String resolveAccountNumber() {
        String configured = blankToNull(sePayProperties.getApiAccountNumber());
        return configured == null ? blankToNull(sePayProperties.getQrBankAccount()) : configured;
    }

    private BigDecimal amount(JsonNode node) {
        if (node == null || node.isMissingNode() || node.isNull()) {
            return null;
        }

        try {
            return new BigDecimal(node.asText()).setScale(2, RoundingMode.HALF_UP);
        } catch (NumberFormatException exception) {
            return null;
        }
    }

    private LocalDateTime parseTransactionDate(String rawDate) {
        if (rawDate == null) {
            return null;
        }

        try {
            return LocalDateTime.parse(rawDate, SEPAY_DATE_TIME_FORMATTER);
        } catch (DateTimeParseException exception) {
            return null;
        }
    }

    private String toVndInteger(BigDecimal amount) {
        return amount.setScale(0, RoundingMode.HALF_UP).toPlainString();
    }

    private String text(JsonNode node) {
        if (node == null || node.isMissingNode() || node.isNull()) {
            return null;
        }

        String value = node.asText();
        return value == null || value.isBlank() ? null : value;
    }

    private String normalize(String value) {
        return value == null ? "" : value.trim().toUpperCase().replace("-", "");
    }

    private String blankToNull(String value) {
        return value == null || value.trim().isBlank() ? null : value.trim();
    }
}
