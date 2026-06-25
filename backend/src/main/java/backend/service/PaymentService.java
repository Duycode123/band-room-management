package backend.service;

import backend.dto.request.SePayIpnRequest;
import backend.dto.response.SePayCheckoutResponse;

public interface PaymentService {

    SePayCheckoutResponse createSePayCheckout(Integer bookingId, String customerEmail);

    String handleSePayIpn(SePayIpnRequest request);
}
