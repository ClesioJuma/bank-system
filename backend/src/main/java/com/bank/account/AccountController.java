package com.bank.account;

import com.bank.account.AccountDtos.AccountResponse;
import com.bank.account.AccountDtos.BalanceResponse;
import com.bank.account.AccountDtos.CreateAccountRequest;
import com.bank.account.AccountDtos.StatementEntry;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/accounts")
@Tag(name = "Contas", description = "Gestão de contas bancárias")
public class AccountController {

    private final AccountService accountService;

    public AccountController(AccountService accountService) {
        this.accountService = accountService;
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Criar conta (apenas admin)")
    public ResponseEntity<AccountResponse> create(@Valid @RequestBody CreateAccountRequest request) {
        Account account = accountService.create(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(AccountResponse.from(account));
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Listar todas as contas (apenas admin)")
    public List<AccountResponse> findAll() {
        return accountService.findAll().stream().map(AccountResponse::from).toList();
    }

    @GetMapping("/mine")
    @Operation(summary = "Listar as minhas contas (cliente)")
    public List<AccountResponse> findMine(Authentication auth) {
        return accountService.findMine(auth.getName()).stream().map(AccountResponse::from).toList();
    }

    @GetMapping("/{id}")
    @Operation(summary = "Consultar uma conta (admin ou dono)")
    public AccountResponse findOne(@PathVariable Long id, Authentication auth) {
        return AccountResponse.from(accountService.findAuthorized(id, auth.getName()));
    }

    @GetMapping("/{id}/balance")
    @Operation(summary = "Consultar o saldo (admin ou dono)")
    public BalanceResponse balance(@PathVariable Long id, Authentication auth) {
        Account account = accountService.findAuthorized(id, auth.getName());
        return new BalanceResponse(account.getAccountNumber(), account.getBalance());
    }

    @PostMapping("/{id}/deposit")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Depositar numa conta (apenas admin)")
    public AccountResponse deposit(@PathVariable Long id,
                                   @Valid @RequestBody AccountDtos.DepositRequest request) {
        return AccountResponse.from(accountService.deposit(id, request.amount(), request.description()));
    }

    @GetMapping("/{id}/statement")
    @Operation(summary = "Consultar o extracto (admin ou dono)")
    public List<StatementEntry> statement(@PathVariable Long id, Authentication auth) {
        return accountService.statement(id, auth.getName());
    }
}
