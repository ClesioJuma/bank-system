package com.bank;

import com.bank.account.AccountRepository;
import com.bank.account.AccountType;
import com.bank.request.AccountRequest;
import com.bank.request.AccountRequestService;
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

/** Testes do fluxo de pedidos de abertura de conta. */
@SpringBootTest
@Transactional
class AccountRequestServiceTests {

    @Autowired private AccountRequestService requestService;
    @Autowired private AccountRepository accountRepository;
    @Autowired private UserRepository userRepository;
    @Autowired private PasswordEncoder passwordEncoder;

    @BeforeEach
    void setUp() {
        User client = new User();
        client.setUsername("cliente.teste");
        client.setPassword(passwordEncoder.encode("teste123"));
        client.setRole(Role.CLIENT);
        client.setFullName("Cliente Teste");
        client.setNuit("333333333");
        userRepository.save(client);
    }

    @Test
    void approvingARequestCreatesTheAccountForTheClient() {
        AccountRequest request = requestService.create(AccountType.ORDEM, "cliente.teste");
        assertThat(request.getStatus()).isEqualTo(AccountRequest.Status.PENDENTE);

        requestService.approve(request.getId(), new BigDecimal("500.00"));

        var user = userRepository.findByUsername("cliente.teste").orElseThrow();
        var accounts = accountRepository.findByOwnerId(user.getId());
        assertThat(accounts).hasSize(1);
        assertThat(accounts.get(0).getBalance()).isEqualByComparingTo("500.00");
        assertThat(accounts.get(0).getCustomerName()).isEqualTo("Cliente Teste");
    }

    @Test
    void cannotHaveTwoPendingRequests() {
        requestService.create(AccountType.ORDEM, "cliente.teste");

        assertThatThrownBy(() -> requestService.create(AccountType.POUPANCA, "cliente.teste"))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("pendente");
    }

    @Test
    void rejectedRequestDoesNotCreateAccount() {
        AccountRequest request = requestService.create(AccountType.ORDEM, "cliente.teste");
        requestService.reject(request.getId());

        var user = userRepository.findByUsername("cliente.teste").orElseThrow();
        assertThat(accountRepository.findByOwnerId(user.getId())).isEmpty();

        // e um pedido já decidido não pode ser aprovado depois
        assertThatThrownBy(() -> requestService.approve(request.getId(), BigDecimal.TEN))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("decidido");
    }
}
