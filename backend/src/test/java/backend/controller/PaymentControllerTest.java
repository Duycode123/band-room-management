package backend.controller;

import backend.dto.response.SePayCheckoutFieldResponse;
import backend.dto.response.SePayCheckoutResponse;
import backend.service.PaymentService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.TestingAuthenticationToken;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.time.LocalDateTime;
import java.util.List;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class PaymentControllerTest {

    @Mock
    private PaymentService paymentService;

    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders
                .standaloneSetup(new PaymentController(paymentService))
                .build();
    }

    @Test
    void returnsSignedCheckoutPayloadForAuthenticatedCustomer() throws Exception {
        SePayCheckoutResponse response = new SePayCheckoutResponse(
                15,
                101L,
                "SP15ABCDE123",
                "BR00000015-SP15ABCDE123",
                "https://pay-sandbox.sepay.vn/v1/checkout/init",
                "POST",
                LocalDateTime.of(2030, 1, 10, 10, 15),
                List.of(
                        new SePayCheckoutFieldResponse("merchant", "merchant-demo"),
                        new SePayCheckoutFieldResponse("signature", "signed-value")
                )
        );

        when(paymentService.createSePayCheckout(15, "customer@example.com")).thenReturn(response);

        mockMvc.perform(post("/api/payments/sepay/bookings/15/checkout")
                        .principal(new TestingAuthenticationToken("customer@example.com", null)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.bookingId").value(15))
                .andExpect(jsonPath("$.data.paymentTransactionId").value(101))
                .andExpect(jsonPath("$.data.actionUrl")
                        .value("https://pay-sandbox.sepay.vn/v1/checkout/init"))
                .andExpect(jsonPath("$.data.fields.length()").value(2))
                .andExpect(jsonPath("$.data.fields[1].name").value("signature"));
    }
}
