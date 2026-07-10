package com.bank.transaction;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface TransactionRepository extends JpaRepository<Transaction, Long> {
    // Extracto: movimentos da conta, do mais recente para o mais antigo
    List<Transaction> findByAccountIdOrderByCreatedAtDesc(Long accountId);
}
