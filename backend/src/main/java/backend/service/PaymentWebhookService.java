package backend.service;

import backend.dto.response.VNPayIpnResponse;

import java.util.Map;

public interface PaymentWebhookService {

    VNPayIpnResponse handleVNPayIpn(Map<String, String> params);

    Map<String, Object> handleSepayWebhook(Map<String, Object> payload);
}
