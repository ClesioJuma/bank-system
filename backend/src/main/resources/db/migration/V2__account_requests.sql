-- Dados pessoais do cliente no registo + pedidos de abertura de conta.

ALTER TABLE users ADD COLUMN full_name VARCHAR(100);
ALTER TABLE users ADD COLUMN nuit VARCHAR(9);

CREATE TABLE account_requests (
    id            BIGSERIAL PRIMARY KEY,
    user_id       BIGINT NOT NULL REFERENCES users(id),
    customer_name VARCHAR(100) NOT NULL,
    nuit          VARCHAR(9) NOT NULL,
    type          VARCHAR(10) NOT NULL CHECK (type IN ('ORDEM', 'POUPANCA')),
    status        VARCHAR(10) NOT NULL DEFAULT 'PENDENTE'
                  CHECK (status IN ('PENDENTE', 'APROVADO', 'REJEITADO')),
    created_at    TIMESTAMP NOT NULL DEFAULT now(),
    decided_at    TIMESTAMP
);
