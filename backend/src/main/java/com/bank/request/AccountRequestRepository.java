package com.bank.request;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface AccountRequestRepository extends JpaRepository<AccountRequest, Long> {
    List<AccountRequest> findByStatusOrderByCreatedAtAsc(AccountRequest.Status status);
    List<AccountRequest> findByUserIdOrderByCreatedAtDesc(Long userId);
}
