package backend.controller;

import backend.config.SePayProperties;
import backend.service.PaymentService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class SePayWebhookControllerTest {

    @Mock
    private PaymentService paymentService;

    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        SePayProperties sePayProperties = new SePayProperties();
        sePayProperties.setIpnSecret("test-secret");

        mockMvc = MockMvcBuilders
                .standaloneSetup(new SePayWebhookController(paymentService, sePayProperties))
                .build();
    }

    @Test
    void acceptsIpnWhenSecretHeaderMatches() throws Exception {
        when(paymentService.handleSePayIpn(any())).thenReturn("Payment confirmed");

        mockMvc.perform(post("/api/webhooks/sepay/ipn")
                        .header("X-Secret-Key", "test-secret")
                        .contentType("application/json")
                        .content("""
                                {
                                  "notification_id": "1",
                                  "notification_type": "ORDER_PAID",
                                  "order": {
                                    "order_invoice_number": "BR00000001-SP1ABCD123"
                                  }
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("Payment confirmed"));
    }

    @Test
    void rejectsIpnWhenSecretHeaderDoesNotMatch() throws Exception {
        mockMvc.perform(post("/api/webhooks/sepay/ipn")
                        .header("X-Secret-Key", "wrong-secret")
                        .contentType("application/json")
                        .content("""
                                {
                                  "notification_id": "1",
                                  "order": {
                                    "order_invoice_number": "BR00000001-SP1ABCD123"
                                  }
                                }
                                """))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.success").value(false));

        verify(paymentService, never()).handleSePayIpn(any());
    }
}
