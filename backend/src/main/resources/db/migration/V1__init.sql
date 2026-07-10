-- Esquema inicial: utilizadores, contas e movimentos.

CREATE TABLE users (
    id          BIGSERIAL PRIMARY KEY,
    username    VARCHAR(50) NOT NULL UNIQUE,
    password    VARCHAR(100) NOT NULL, -- guardada com BCrypt, nunca em texto simples
    role        VARCHAR(10) NOT NULL CHECK (role IN ('ADMIN', 'CLIENT')),
    created_at  TIMESTAMP NOT NULL DEFAULT now()
);

CREATE TABLE accounts (
    id             BIGSERIAL PRIMARY KEY,
    customer_name  VARCHAR(100) NOT NULL,
    nuit           VARCHAR(9) NOT NULL,
    account_number VARCHAR(20) NOT NULL UNIQUE, -- regra: nao pode haver nnmeros repetidos
    type           VARCHAR(10) NOT NULL CHECK (type IN ('ORDEM', 'POUPANCA')),
    balance        NUMERIC(15,2) NOT NULL CHECK (balance >= 0), -- regra: saldo nunca negativo
    owner_user_id  BIGINT REFERENCES users(id),
    created_at     TIMESTAMP NOT NULL DEFAULT now()
);

CREATE TABLE transactions (
    id                BIGSERIAL PRIMARY KEY,
    account_id        BIGINT NOT NULL REFERENCES accounts(id),
    type              VARCHAR(30) NOT NULL,
    amount            NUMERIC(15,2) NOT NULL CHECK (amount > 0), -- regra: so valores positivos
    resulting_balance NUMERIC(15,2) NOT NULL,
    description       VARCHAR(255),
    created_at        TIMESTAMP NOT NULL DEFAULT now()
);

-- indice para o extracto (consultas por conta, ordenadas por data)
CREATE INDEX idx_transactions_account ON transactions(account_id, created_at DESC);
