package backend.auth.application.port.in.command;

public record RegisterUserCommand(
        String fullName,
        String email,
        String phone,
        String password
) {
}
