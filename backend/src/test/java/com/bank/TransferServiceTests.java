package com.bank;

import com.bank.account.Account;
import com.bank.account.AccountDtos.CreateAccountRequest;
import com.bank.account.AccountRepository;
import com.bank.account.AccountService;
import com.bank.account.AccountType;
import com.bank.transaction.TransactionRepository;
import com.bank.transfer.TransferDtos.TransferRequest;
import com.bank.transfer.TransferService;
import com.bank.user.Role;
import com.bank.user.User;
import com.bank.user.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * Testes das regras de negócio das transferências.
 * @Transactional nos testes: cada teste corre numa transacção
 * que é desfeita no fim, por isso a base de dados fica limpa.
 */
@SpringBootTest
@Transactional
class TransferServiceTests {

    @Autowired private TransferService transferService;
    @Autowired private AccountService accountService;
    @Autowired private AccountRepository accountRepository;
    @Autowired private TransactionRepository transactionRepository;
    @Autowired private UserRepository userRepository;
    @Autowired private PasswordEncoder passwordEncoder;

    private Account mariaAccount;
    private Account joaoAccount;

    @BeforeEach
    void setUp() {
        createUser("maria.teste", Role.CLIENT);
        createUser("admin.teste", Role.ADMIN);

        mariaAccount = accountService.create(new CreateAccountRequest(
                "Maria Teste", "111111111", AccountType.ORDEM, new BigDecimal("1000.00"), "maria.teste"));
        joaoAccount = accountService.create(new CreateAccountRequest(
                "Joao Teste", "222222222", AccountType.POUPANCA, new BigDecimal("500.00"), null));
    }

    @Test
    void transferMovesMoneyAndRecordsBothMovements() {
        transferService.transfer(request("250.00"), "maria.teste");

        assertThat(balanceOf(mariaAccount)).isEqualByComparingTo("750.00");
        assertThat(balanceOf(joaoAccount)).isEqualByComparingTo("750.00");

        // Cada conta fica com 2 movimentos: o depósito inicial + a transferência
        assertThat(transactionRepository.findByAccountIdOrderByCreatedAtDesc(mariaAccount.getId())).hasSize(2);
        assertThat(transactionRepository.findByAccountIdOrderByCreatedAtDesc(joaoAccount.getId())).hasSize(2);
    }

    @Test
    void transferFailsWhenBalanceIsInsufficient() {
        assertThatThrownBy(() -> transferService.transfer(request("9999.00"), "maria.teste"))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("Saldo insuficiente");

        // Nada mudou: atomicidade
        assertThat(balanceOf(mariaAccount)).isEqualByComparingTo("1000.00");
        assertThat(balanceOf(joaoAccount)).isEqualByComparingTo("500.00");
    }

    @Test
    void clientCannotTransferFromSomeoneElsesAccount() {
        TransferRequest fromJoao = new TransferRequest(
                joaoAccount.getAccountNumber(), mariaAccount.getAccountNumber(),
                new BigDecimal("10.00"), null);

        assertThatThrownBy(() -> transferService.transfer(fromJoao, "maria.teste"))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("conta sua");
    }

    @Test
    void transferToSameAccountIsRejected() {
        TransferRequest sameAccount = new TransferRequest(
                mariaAccount.getAccountNumber(), mariaAccount.getAccountNumber(),
                new BigDecimal("10.00"), null);

        assertThatThrownBy(() -> transferService.transfer(sameAccount, "maria.teste"))
                .isInstanceOf(ResponseStatusException.class);
    }

    @Test
    void adminCanTransferFromAnyAccount() {
        transferService.transfer(request("100.00"), "admin.teste");
        assertThat(balanceOf(mariaAccount)).isEqualByComparingTo("900.00");
    }

    @Test
    void initialBalanceIsRecordedAsFirstMovement() {
        var statement = transactionRepository.findByAccountIdOrderByCreatedAtDesc(mariaAccount.getId());
        assertThat(statement).hasSize(1);
        assertThat(statement.get(0).getAmount()).isEqualByComparingTo("1000.00");
        assertThat(statement.get(0).getResultingBalance()).isEqualByComparingTo("1000.00");
    }

    @Test
    void depositIncreasesBalanceAndRecordsMovement() {
        accountService.deposit(mariaAccount.getId(), new BigDecimal("500.00"), "Depósito ao balcão");

        assertThat(balanceOf(mariaAccount)).isEqualByComparingTo("1500.00");
        var statement = transactionRepository.findByAccountIdOrderByCreatedAtDesc(mariaAccount.getId());
        assertThat(statement.get(0).getResultingBalance()).isEqualByComparingTo("1500.00");
    }

    @Test
    void generatedAccountNumbersAreUnique() {
        assertThat(mariaAccount.getAccountNumber()).isNotEqualTo(joaoAccount.getAccountNumber());
        assertThat(mariaAccount.getAccountNumber()).hasSize(10);
    }

    // --- auxiliares ---

    private TransferRequest request(String amount) {
        return new TransferRequest(mariaAccount.getAccountNumber(), joaoAccount.getAccountNumber(),
                new BigDecimal(amount), "Teste");
    }

    private BigDecimal balanceOf(Account account) {
        return accountRepository.findById(account.getId()).orElseThrow().getBalance();
    }

    private void createUser(String username, Role role) {
        User user = new User();
        user.setUsername(username);
        user.setPassword(passwordEncoder.encode("teste123"));
        user.setRole(role);
        userRepository.save(user);
    }
}
