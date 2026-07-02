package backend.controller;

import backend.dto.response.VNPayIpnResponse;
import backend.service.PaymentWebhookService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/payments")
@RequiredArgsConstructor
public class PaymentWebhookController {

    private final PaymentWebhookService paymentWebhookService;

    @GetMapping("/vnpay/ipn")
    public ResponseEntity<VNPayIpnResponse> handleVNPayIpn(@RequestParam Map<String, String> params) {
        return ResponseEntity.ok(paymentWebhookService.handleVNPayIpn(params));
    }

    @PostMapping("/sepay/webhook")
    public ResponseEntity<Map<String, Object>> handleSepayWebhook(@RequestBody Map<String, Object> payload) {
        return ResponseEntity.ok(paymentWebhookService.handleSepayWebhook(payload));
    }
}
