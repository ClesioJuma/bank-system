package com.bank.transfer;

import com.bank.account.Account;
import com.bank.account.AccountRepository;
import com.bank.account.AccountService;
import com.bank.transaction.TransactionType;
import com.bank.transfer.TransferDtos.TransferRequest;
import com.bank.transfer.TransferDtos.TransferResponse;
import com.bank.user.Role;
import com.bank.user.User;
import com.bank.user.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;

@Service
public class TransferService {

    private final AccountRepository accountRepository;
    private final AccountService accountService;
    private final UserRepository userRepository;

    public TransferService(AccountRepository accountRepository,
                           AccountService accountService,
                           UserRepository userRepository) {
        this.accountRepository = accountRepository;
        this.accountService = accountService;
        this.userRepository = userRepository;
    }

    /**
     * Transferencia entre contas. @Transactional garante a atomicidade:
     * ou tudo acontece (debito + credito + 2 movimentos), ou nada acontece (rollback).
     */
    @Transactional
    public TransferResponse transfer(TransferRequest request, String username) {
        if (request.sourceAccountNumber().equals(request.destinationAccountNumber())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "A conta de origem e de destino não podem ser a mesma");
        }

        // Procura as contas e bloqueia as linhas (SELECT ... FOR UPDATE)
        // para nenhuma outra operacao mexer nestes saldos ao mesmo tempo.
        Long sourceId = findId(request.sourceAccountNumber(), "Conta de origem não encontrada");
        Long destinationId = findId(request.destinationAccountNumber(), "Conta de destino não encontrada");

        // Bloqueia sempre por ordem de id para evitar deadlock entre duas
        // transferencias cruzadas (A->B e B->A em simultaneo)
        Account first = lock(Math.min(sourceId, destinationId));
        Account second = lock(Math.max(sourceId, destinationId));
        Account source = first.getId().equals(sourceId) ? first : second;
        Account destination = first.getId().equals(sourceId) ? second : first;

        // Cliente so pode transferir a partir de uma conta sua
        User user = userRepository.findByUsername(username).orElseThrow();
        boolean isOwner = source.getOwner() != null && source.getOwner().getId().equals(user.getId());
        if (user.getRole() != Role.ADMIN && !isOwner) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "Só pode transferir a partir de uma conta sua");
        }

        if (source.getBalance().compareTo(request.amount()) < 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Saldo insuficiente");
        }

        // Debito na origem, credito no destino
        source.setBalance(source.getBalance().subtract(request.amount()));
        destination.setBalance(destination.getBalance().add(request.amount()));

        // Regista o movimento nas duas contas, cada um com o seu saldo resultante
        String description = request.description() == null ? "Transferência" : request.description();
        accountService.recordMovement(source, TransactionType.TRANSFERENCIA_ENVIADA,
                request.amount(), description + " para a conta " + destination.getAccountNumber());
        accountService.recordMovement(destination, TransactionType.TRANSFERENCIA_RECEBIDA,
                request.amount(), description + " da conta " + source.getAccountNumber());

        return new TransferResponse(
                source.getAccountNumber(),
                destination.getAccountNumber(),
                request.amount(),
                source.getBalance(),
                description,
                LocalDateTime.now());
    }

    private Long findId(String accountNumber, String notFoundMessage) {
        return accountRepository.findByAccountNumber(accountNumber)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, notFoundMessage))
                .getId();
    }

    private Account lock(Long id) {
        return accountRepository.findByIdForUpdate(id).orElseThrow();
    }
}
