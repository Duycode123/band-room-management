package backend.controller;

import backend.common.ApiResponse;
import backend.dto.response.SePayCheckoutResponse;
import backend.service.PaymentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/payments")
@RequiredArgsConstructor
public class PaymentController {

    private final PaymentService paymentService;

    @PostMapping("/sepay/bookings/{bookingId}/checkout")
    public ResponseEntity<ApiResponse<SePayCheckoutResponse>> createSePayCheckout(
            @PathVariable Integer bookingId,
            Authentication authentication
    ) {
        SePayCheckoutResponse data = paymentService.createSePayCheckout(
                bookingId,
                authentication.getName()
        );

        return ResponseEntity.ok(
                ApiResponse.<SePayCheckoutResponse>builder()
                        .success(true)
                        .message("Tao thong tin thanh toan SePay thanh cong")
                        .data(data)
                        .build()
        );
    }
}
