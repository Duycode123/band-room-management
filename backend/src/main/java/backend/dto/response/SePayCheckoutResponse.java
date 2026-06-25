package backend.dto.response;

import java.time.LocalDateTime;
import java.util.List;

public record SePayCheckoutResponse(
        Integer bookingId,
        Long paymentTransactionId,
        String transactionReference,
        String orderInvoiceNumber,
        String actionUrl,
        String method,
        LocalDateTime expiresAt,
        List<SePayCheckoutFieldResponse> fields
) {
}
