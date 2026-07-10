# Gestão de Contas Bancárias

Aplicação full stack que simula um módulo bancário: abertura de contas,
consulta de saldo, transferências e extracto de movimentos.

Backend em Java 17 com Spring Boot 3, Spring Security (JWT) e Spring Data
JPA. Base de dados PostgreSQL com migrações Flyway. Frontend em Angular.
Tudo sobe com Docker Compose.

## Como executar

```bash
docker compose up --build
```

Frontend em http://localhost e Swagger em http://localhost:8080/swagger-ui.html

Sem Docker: Java 17, Node 20+ e um PostgreSQL local com a base `bankdb`
(utilizador `bank`, password `bank`, ou definir `DB_URL`, `DB_USER` e
`DB_PASSWORD`).

```bash
cd backend && ./mvnw spring-boot:run    # API na porta 8080
cd frontend && npm install && npm start # frontend na porta 4200
```

No primeiro arranque é criado o administrador `admin` / `admin123`.
Os clientes registam-se no ecrã de login com nome completo e NUIT.

## Como funciona

O cliente regista-se e pede a abertura de uma conta (à ordem ou poupança).
O administrador decide o pedido no seu módulo, definindo o depósito inicial
ao aprovar. Depois disso o cliente consulta o saldo, vê o extracto e faz
transferências a partir das suas contas. O administrador também pesquisa
todas as contas, cria contas directamente, consulta qualquer extracto e
faz depósitos ao balcão.

## Arquitectura

Arquitectura em camadas: controllers tratam do HTTP, services concentram
as regras de negócio e as transacções, repositories (Spring Data JPA)
tratam dos dados. Pacotes organizados por domínio (`account`, `transfer`,
`request`, `user`). A API expõe DTOs, nunca as entidades. A segurança
(filtro JWT) e o tratamento de erros são transversais. No frontend, a
pasta `core` tem os serviços, o interceptor e os guards, e as páginas
estão separadas por perfil em `pages/admin` e `pages/client`.

## Regras de negócio

- Números de conta gerados pelo sistema e únicos (índice único na base).
- Saldo nunca negativo e apenas valores positivos, validado na aplicação
  e reforçado com constraints na base de dados.
- Abertura com mínimo de 500 MZN; depósitos ao balcão com mínimo de 100.
- Todas as operações registadas com data e hora, e cada movimento guarda
  o saldo resultante.
- Transferências atómicas: débito, crédito e os dois movimentos numa única
  transacção, com rollback se algo falhar. As contas são bloqueadas com
  lock pessimista, por ordem de id para evitar deadlocks.

## Segurança

Autenticação JWT com dois perfis. O administrador cria contas e consulta
todas as contas e extractos. O cliente só vê as suas contas, o seu saldo
e o seu extracto, e só transfere a partir de contas suas. A separação em
módulos no frontend é apenas visual: quem garante as permissões é a API.

## Endpoints principais

- `POST /api/auth/login`: devolve o token JWT
- `POST /api/auth/register`: registo de cliente
- `POST /api/accounts`: criar conta (admin)
- `GET /api/accounts`: listar todas (admin)
- `GET /api/accounts/mine`: as contas do próprio cliente
- `GET /api/accounts/{id}/balance`: consultar saldo
- `GET /api/accounts/{id}/statement`: extracto de movimentos
- `POST /api/accounts/{id}/deposit`: depósito ao balcão (admin)
- `POST /api/transfers`: transferência entre contas
- `POST /api/account-requests`: pedir abertura de conta (cliente)
- `GET /api/account-requests/pending`: pedidos pendentes (admin)
- `POST /api/account-requests/{id}/approve`: aprovar e criar a conta (admin)
- `POST /api/account-requests/{id}/reject`: rejeitar (admin)

A documentação completa está no Swagger, com o botão Authorize para colar
o token. Na raiz há também uma colecção Postman (`postman_collection.json`)
em que o login guarda o token automaticamente.

## Base de dados

O esquema é criado pelas migrações Flyway em
`backend/src/main/resources/db/migration`; o Hibernate apenas valida.
Os valores monetários usam `BigDecimal` e colunas `NUMERIC` para evitar
erros de arredondamento.

## Testes

```bash
cd backend && ./mvnw test
```

Testes de integração ao nível do serviço: sobem a aplicação com
`@SpringBootTest` contra o PostgreSQL real, porque é na base de dados que
as regras importantes (atomicidade, locks, constraints) se provam. Cada
teste corre numa transacção desfeita no fim, deixando a base limpa.
Cobrem transferências, saldo insuficiente (provando que nada muda),
permissões, depósitos e mínimos, aprovação e rejeição de pedidos, e a
unicidade dos números de conta.

## Fontes de estudo

Alguns conteúdos que serviram de apoio durante o desenvolvimento:

- Arquitectura em camadas com Spring Boot:
  https://youtu.be/ubG-mFj9cSE
- Autenticação e autorização com Spring Security, JWT e roles:
  https://youtu.be/5w-YCcOjPD0
- Resolução de um desafio técnico backend com Java Spring:
  https://www.youtube.com/watch?v=QXunBiLq2SM
