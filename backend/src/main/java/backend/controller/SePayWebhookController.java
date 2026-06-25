package backend.controller;

import backend.config.SePayProperties;
import backend.dto.request.SePayIpnRequest;
import backend.service.PaymentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;
import java.util.Objects;

@RestController
@RequestMapping("/api/webhooks/sepay")
@RequiredArgsConstructor
public class SePayWebhookController {

    private final PaymentService paymentService;
    private final SePayProperties sePayProperties;

    @PostMapping("/ipn")
    public ResponseEntity<Map<String, Object>> handleIpn(
            @RequestHeader(value = "X-Secret-Key", required = false) String providedSecret,
            @RequestBody(required = false) SePayIpnRequest request
    ) {
        if (StringUtils.hasText(sePayProperties.getIpnSecret())
                && !Objects.equals(sePayProperties.getIpnSecret(), providedSecret)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of(
                    "success", false,
                    "message", "Unauthorized"
            ));
        }

        String message = paymentService.handleSePayIpn(request);

        return ResponseEntity.ok(Map.of(
                "success", true,
                "message", message
        ));
    }
}
