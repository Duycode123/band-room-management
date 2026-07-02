package backend.payment.adapter.in.web;

import backend.common.ApiResponse;
import backend.payment.adapter.in.web.dto.request.CreatePaymentSessionRequest;
import backend.payment.application.model.PaymentSessionResult;
import backend.payment.application.model.PaymentTransactionDetail;
import backend.payment.application.service.PaymentCheckoutUseCaseService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/payments")
@RequiredArgsConstructor
public class PaymentController {

    private final PaymentCheckoutUseCaseService paymentCheckoutUseCaseService;

    @PostMapping("/sessions")
    public ResponseEntity<ApiResponse<PaymentSessionResult>> createPaymentSession(
            @RequestBody CreatePaymentSessionRequest request,
            Authentication authentication
    ) {
        PaymentSessionResult data = paymentCheckoutUseCaseService.createPaymentSession(
                request.getBookingId(),
                request.getMethod(),
                authentication.getName()
        );

        return ResponseEntity.ok(success("Tao phien thanh toan thanh cong", data));
    }

    @GetMapping("/transactions/{paymentId}")
    public ResponseEntity<ApiResponse<PaymentTransactionDetail>> getPaymentTransaction(
            @PathVariable String paymentId,
            Authentication authentication
    ) {
        PaymentTransactionDetail data = paymentCheckoutUseCaseService.getPaymentTransactionDetail(
                paymentId,
                authentication.getName()
        );

        return ResponseEntity.ok(success("Lay giao dich thanh toan thanh cong", data));
    }

    private <T> ApiResponse<T> success(String message, T data) {
        return ApiResponse.<T>builder()
                .success(true)
                .message(message)
                .data(data)
                .build();
    }
}
