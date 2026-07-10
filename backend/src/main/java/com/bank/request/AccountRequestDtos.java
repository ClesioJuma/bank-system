package com.bank.request;

import com.bank.account.AccountType;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public class AccountRequestDtos {

    public record CreateRequest(@NotNull AccountType type) {
    }

    /** O admin define o depósito inicial ao aprovar (como ao balcão). */
    public record ApproveRequest(
            @NotNull @DecimalMin(value = "500.00", message = "O depósito inicial mínimo é 500 MZN") BigDecimal initialBalance) {
    }

    public record RequestResponse(
            Long id,
            String username,
            String customerName,
            String nuit,
            AccountType type,
            AccountRequest.Status status,
            LocalDateTime createdAt,
            LocalDateTime decidedAt) {

        static RequestResponse from(AccountRequest r) {
            return new RequestResponse(r.getId(), r.getUser().getUsername(), r.getCustomerName(),
                    r.getNuit(), r.getType(), r.getStatus(), r.getCreatedAt(), r.getDecidedAt());
        }
    }
}
