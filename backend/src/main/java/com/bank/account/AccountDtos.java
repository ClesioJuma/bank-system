package com.bank.account;

import com.bank.transaction.TransactionType;
import jakarta.validation.constraints.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/** DTOs das contas: o que entra e o que sai da API. */
public class AccountDtos {

    public record CreateAccountRequest(
            @NotBlank String customerName,
            @NotBlank @Pattern(regexp = "\\d{9}", message = "O NUIT deve ter 9 dígitos") String nuit,
            @NotNull AccountType type,
            @NotNull @DecimalMin(value = "500.00", message = "O depósito inicial mínimo é 500 MZN") BigDecimal initialBalance,
            // Username do cliente dono da conta (opcional)
            String ownerUsername) {
    }

    public record AccountResponse(
            Long id,
            String customerName,
            String nuit,
            String accountNumber,
            AccountType type,
            BigDecimal balance,
            String ownerUsername,
            LocalDateTime createdAt) {

        static AccountResponse from(Account account) {
            return new AccountResponse(
                    account.getId(),
                    account.getCustomerName(),
                    account.getNuit(),
                    account.getAccountNumber(),
                    account.getType(),
                    account.getBalance(),
                    account.getOwner() != null ? account.getOwner().getUsername() : null,
                    account.getCreatedAt());
        }
    }

    public record BalanceResponse(String accountNumber, BigDecimal balance) {
    }

    public record DepositRequest(
            @NotNull @DecimalMin(value = "100.00", message = "O depósito mínimo é 100 MZN") BigDecimal amount,
            String description) {
    }

    /** Uma linha do extracto. */
    public record StatementEntry(
            LocalDateTime dateTime,
            TransactionType type,
            BigDecimal amount,
            BigDecimal resultingBalance,
            String description) {
    }
}
