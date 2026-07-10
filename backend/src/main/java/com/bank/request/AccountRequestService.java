package com.bank.request;

import com.bank.account.AccountDtos.CreateAccountRequest;
import com.bank.account.AccountService;
import com.bank.account.AccountType;
import com.bank.user.User;
import com.bank.user.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Service
public class AccountRequestService {

    private final AccountRequestRepository requestRepository;
    private final UserRepository userRepository;
    private final AccountService accountService;

    public AccountRequestService(AccountRequestRepository requestRepository,
                                 UserRepository userRepository,
                                 AccountService accountService) {
        this.requestRepository = requestRepository;
        this.userRepository = userRepository;
        this.accountService = accountService;
    }

    /** Cliente pede a abertura de uma conta; os dados pessoais vem' do registo. */
    public AccountRequest create(AccountType type, String username) {
        User user = userRepository.findByUsername(username).orElseThrow();

        boolean hasPending = requestRepository.findByUserIdOrderByCreatedAtDesc(user.getId()).stream()
                .anyMatch(r -> r.getStatus() == AccountRequest.Status.PENDENTE);
        if (hasPending) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Já tem um pedido de abertura pendente");
        }

        AccountRequest request = new AccountRequest();
        request.setUser(user);
        request.setCustomerName(user.getFullName());
        request.setNuit(user.getNuit());
        request.setType(type);
        return requestRepository.save(request);
    }

    public List<AccountRequest> pending() {
        return requestRepository.findByStatusOrderByCreatedAtAsc(AccountRequest.Status.PENDENTE);
    }

    public List<AccountRequest> mine(String username) {
        User user = userRepository.findByUsername(username).orElseThrow();
        return requestRepository.findByUserIdOrderByCreatedAtDesc(user.getId());
    }

    /** Aprovar = criar a conta (reutiliza o fluxo normal de criaçao do admin). */
    @Transactional
    public AccountRequest approve(Long requestId, BigDecimal initialBalance) {
        AccountRequest request = findPending(requestId);

        accountService.create(new CreateAccountRequest(
                request.getCustomerName(),
                request.getNuit(),
                request.getType(),
                initialBalance,
                request.getUser().getUsername()));

        request.setStatus(AccountRequest.Status.APROVADO);
        request.setDecidedAt(LocalDateTime.now());
        return requestRepository.save(request);
    }

    @Transactional
    public AccountRequest reject(Long requestId) {
        AccountRequest request = findPending(requestId);
        request.setStatus(AccountRequest.Status.REJEITADO);
        request.setDecidedAt(LocalDateTime.now());
        return requestRepository.save(request);
    }

    private AccountRequest findPending(Long id) {
        AccountRequest request = requestRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Pedido não encontrado"));
        if (request.getStatus() != AccountRequest.Status.PENDENTE) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Este pedido já foi decidido");
        }
        return request;
    }
}
