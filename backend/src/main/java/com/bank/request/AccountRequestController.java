package com.bank.request;

import com.bank.request.AccountRequestDtos.ApproveRequest;
import com.bank.request.AccountRequestDtos.CreateRequest;
import com.bank.request.AccountRequestDtos.RequestResponse;
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
@RequestMapping("/api/account-requests")
@Tag(name = "Pedidos de abertura", description = "Pedidos de abertura de conta (cliente pede, admin decide)")
public class AccountRequestController {

    private final AccountRequestService requestService;

    public AccountRequestController(AccountRequestService requestService) {
        this.requestService = requestService;
    }

    @PostMapping
    @Operation(summary = "Pedir abertura de conta (cliente)")
    public ResponseEntity<RequestResponse> create(@Valid @RequestBody CreateRequest body, Authentication auth) {
        AccountRequest request = requestService.create(body.type(), auth.getName());
        return ResponseEntity.status(HttpStatus.CREATED).body(RequestResponse.from(request));
    }

    @GetMapping("/mine")
    @Operation(summary = "Os meus pedidos (cliente)")
    public List<RequestResponse> mine(Authentication auth) {
        return requestService.mine(auth.getName()).stream().map(RequestResponse::from).toList();
    }

    @GetMapping("/pending")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Pedidos pendentes (admin)")
    public List<RequestResponse> pending() {
        return requestService.pending().stream().map(RequestResponse::from).toList();
    }

    @PostMapping("/{id}/approve")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Aprovar pedido e criar a conta (admin)")
    public RequestResponse approve(@PathVariable Long id, @Valid @RequestBody ApproveRequest body) {
        return RequestResponse.from(requestService.approve(id, body.initialBalance()));
    }

    @PostMapping("/{id}/reject")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Rejeitar pedido (admin)")
    public RequestResponse reject(@PathVariable Long id) {
        return RequestResponse.from(requestService.reject(id));
    }
}
