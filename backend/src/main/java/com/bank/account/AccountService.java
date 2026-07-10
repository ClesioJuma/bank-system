package com.bank.account;

import com.bank.account.AccountDtos.CreateAccountRequest;
import com.bank.account.AccountDtos.StatementEntry;
import com.bank.transaction.Transaction;
import com.bank.transaction.TransactionRepository;
import com.bank.transaction.TransactionType;
import com.bank.user.Role;
import com.bank.user.User;
import com.bank.user.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.security.SecureRandom;
import java.util.List;

@Service
public class AccountService {

    private final AccountRepository accountRepository;
    private final TransactionRepository transactionRepository;
    private final UserRepository userRepository;
    private final SecureRandom random = new SecureRandom();

    public AccountService(AccountRepository accountRepository,
                          TransactionRepository transactionRepository,
                          UserRepository userRepository) {
        this.accountRepository = accountRepository;
        this.transactionRepository = transactionRepository;
        this.userRepository = userRepository;
    }

    @Transactional
    public Account create(CreateAccountRequest request) {
        Account account = new Account();
        account.setCustomerName(request.customerName());
        account.setNuit(request.nuit());
        account.setAccountNumber(generateUniqueAccountNumber());
        account.setType(request.type());
        account.setBalance(request.initialBalance());

        // Associa a conta a um cliente, se o admin indicou um
        if (request.ownerUsername() != null && !request.ownerUsername().isBlank()) {
            User owner = userRepository.findByUsername(request.ownerUsername())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                            "Utilizador não encontrado: " + request.ownerUsername()));
            account.setOwner(owner);
        }

        accountRepository.save(account);

        // O saldo inicial fica registado como o primeiro movimento da conta
        if (account.getBalance().compareTo(BigDecimal.ZERO) > 0) {
            recordMovement(account, TransactionType.DEPOSITO_INICIAL,
                    account.getBalance(), "Depósito de abertura de conta");
        }
        return account;
    }

    public List<Account> findAll() {
        return accountRepository.findAll();
    }

    /** Devolve a conta se o utilizador puder vela */
    public Account findAuthorized(Long accountId, String username) {
        Account account = accountRepository.findById(accountId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Conta não encontrada"));

        User user = userRepository.findByUsername(username).orElseThrow();
        boolean isOwner = account.getOwner() != null && account.getOwner().getId().equals(user.getId());
        if (user.getRole() != Role.ADMIN && !isOwner) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Não tem acesso a esta conta");
        }
        return account;
    }

    /** Contas do cliente autenticado. */
    public List<Account> findMine(String username) {
        User user = userRepository.findByUsername(username).orElseThrow();
        return accountRepository.findByOwnerId(user.getId());
    }

    public List<StatementEntry> statement(Long accountId, String username) {
        Account account = findAuthorized(accountId, username); // reaproveita a verificação de acesso
        return transactionRepository.findByAccountIdOrderByCreatedAtDesc(account.getId()).stream()
                .map(t -> new StatementEntry(t.getCreatedAt(), t.getType(),
                        t.getAmount(), t.getResultingBalance(), t.getDescription()))
                .toList();
    }

    /** Depósito ao balcao: o admin credita dinheiro numa conta. */
    @Transactional
    public Account deposit(Long accountId, BigDecimal amount, String description) {
        // Block de llinha para nao colidir com transferencias em curso
        Account account = accountRepository.findByIdForUpdate(accountId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Conta não encontrada"));

        account.setBalance(account.getBalance().add(amount));
        recordMovement(account, TransactionType.DEPOSITO, amount,
                description == null || description.isBlank() ? "Deposito ao balcao" : description);
        return account;
    }

    /** Grava uma linha de movimento com o saldo resultante. */
    public void recordMovement(Account account, TransactionType type, BigDecimal amount, String description) {
        Transaction t = new Transaction();
        t.setAccount(account);
        t.setType(type);
        t.setAmount(amount);
        t.setResultingBalance(account.getBalance());
        t.setDescription(description);
        transactionRepository.save(t);
    }

    /** Gera um numero de conta de 10 digitos; repete se ja existir (muito improvavel). */
    private String generateUniqueAccountNumber() {
        String number;
        do {
            number = String.valueOf(1_000_000_000L + (long) (random.nextDouble() * 9_000_000_000L));
        } while (accountRepository.existsByAccountNumber(number));
        return number;
    }
}
