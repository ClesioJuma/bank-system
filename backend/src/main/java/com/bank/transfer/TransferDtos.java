package com.bank.transfer;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public class TransferDtos {

    public record TransferRequest(
            @NotBlank String sourceAccountNumber,
            @NotBlank String destinationAccountNumber,
            @NotNull @Positive(message = "O valor deve ser positivo") BigDecimal amount,
            String description) {
    }

    public record TransferResponse(
            String sourceAccountNumber,
            String destinationAccountNumber,
            BigDecimal amount,
            BigDecimal sourceBalanceAfter,
            String description,
            LocalDateTime dateTime) {
    }
}
