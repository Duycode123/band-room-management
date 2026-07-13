package backend.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class AiChatHistoryMessage {

    @NotBlank
    @Size(max = 32)
    private String role;

    @NotBlank
    @Size(max = 2000)
    private String content;
}
