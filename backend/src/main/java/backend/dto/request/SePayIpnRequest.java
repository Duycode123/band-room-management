package backend.dto.request;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.databind.PropertyNamingStrategies;
import com.fasterxml.jackson.databind.annotation.JsonNaming;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
@JsonNaming(PropertyNamingStrategies.SnakeCaseStrategy.class)
public class SePayIpnRequest {

    private String notificationId;
    private String notificationType;
    private Transaction transaction;
    private Customer customer;
    private Order order;

    @Getter
    @Setter
    @NoArgsConstructor
    @JsonIgnoreProperties(ignoreUnknown = true)
    @JsonNaming(PropertyNamingStrategies.SnakeCaseStrategy.class)
    public static class Transaction {
        private String transactionId;
        private String transactionDate;
        private String accountNumber;
        private String bankCode;
        private BigDecimal transactionAmount;
        private BigDecimal paymentAmount;
        private String transactionStatus;
        private String transactionType;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @JsonIgnoreProperties(ignoreUnknown = true)
    @JsonNaming(PropertyNamingStrategies.SnakeCaseStrategy.class)
    public static class Customer {
        private String customerId;
        private String customerEmail;
        private String customerPhone;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @JsonIgnoreProperties(ignoreUnknown = true)
    @JsonNaming(PropertyNamingStrategies.SnakeCaseStrategy.class)
    public static class Order {
        private String orderId;
        private String orderCode;
        private String orderInvoiceNumber;
        private String orderDescription;
        private BigDecimal orderAmount;
        private String orderCurrency;
        private String orderStatus;
    }
}
