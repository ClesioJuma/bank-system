package com.bank.transfer;

import com.bank.transfer.TransferDtos.TransferRequest;
import com.bank.transfer.TransferDtos.TransferResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/transfers")
@Tag(name = "Transferências", description = "Transferências entre contas")
public class TransferController {

    private final TransferService transferService;

    public TransferController(TransferService transferService) {
        this.transferService = transferService;
    }

    @PostMapping
    @Operation(summary = "Transferir entre contas (cliente: só a partir das suas)")
    public ResponseEntity<TransferResponse> transfer(@Valid @RequestBody TransferRequest request,
                                                     Authentication auth) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(transferService.transfer(request, auth.getName()));
    }
}
