package com.bank.auth;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/** DTOs da auth (records: classes imutaveis so com dados). */
public class AuthDtos {

    public record LoginRequest(
            @NotBlank String username,
            @NotBlank String password) {
    }

    public record RegisterRequest(
            @NotBlank String username,
            @NotBlank @Size(min = 6, message = "A password deve ter pelo menos 6 caracteres") String password,
            @NotBlank String fullName,
            @NotBlank @Pattern(regexp = "\\d{9}", message = "O NUIT deve ter 9 dígitos") String nuit) {
    }

    public record AuthResponse(String token, String username, String role) {
    }
}
