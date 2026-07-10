package com.bank.auth;

import com.bank.auth.AuthDtos.AuthResponse;
import com.bank.auth.AuthDtos.LoginRequest;
import com.bank.auth.AuthDtos.RegisterRequest;
import com.bank.security.JwtService;
import com.bank.user.Role;
import com.bank.user.User;
import com.bank.user.UserRepository;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthenticationManager authenticationManager;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public AuthController(AuthenticationManager authenticationManager,
                          UserRepository userRepository,
                          PasswordEncoder passwordEncoder,
                          JwtService jwtService) {
        this.authenticationManager = authenticationManager;
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
    }

    @PostMapping("/login")
    public AuthResponse login(@Valid @RequestBody LoginRequest request) {
        // Valida as credenciais; se estiverem erradas lansa excepcao (devolve 401)
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.username(), request.password()));

        User user = userRepository.findByUsername(request.username()).orElseThrow();
        return new AuthResponse(jwtService.generateToken(user), user.getUsername(), user.getRole().name());
    }

    /** Regista um novo cliente (o admin e criado automaticamente no arranque). */
    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest request) {
        if (userRepository.existsByUsername(request.username())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Este username já está em uso");
        }

        User user = new User();
        user.setUsername(request.username());
        user.setPassword(passwordEncoder.encode(request.password()));
        user.setRole(Role.CLIENT);
        user.setFullName(request.fullName());
        user.setNuit(request.nuit());
        userRepository.save(user);

        AuthResponse body = new AuthResponse(jwtService.generateToken(user), user.getUsername(), user.getRole().name());
        return ResponseEntity.status(HttpStatus.CREATED).body(body);
    }
}
