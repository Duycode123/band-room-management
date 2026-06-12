package backend.controller;

import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @GetMapping("/register")
    public String register() {
        return "Register Success";
    }
}