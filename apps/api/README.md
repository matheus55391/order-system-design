# API — Order System

Backend NestJS B2B multi-tenant. Swagger: http://localhost:3001/docs

## Estrutura

```
src/
├── common/           → JWT, guards, decorators, DTOs compartilhados
├── infrastructure/   → Prisma, Redis, RabbitMQ, Email, MinIO (@Global)
└── modules/          → auth, catalog, cart, reservations, orders, audit, inventory-management
                      + inventory/ (InventoryService — sem módulo próprio)
```

## Módulos

| Módulo | Responsabilidade | Cache | RabbitMQ |
|--------|------------------|-------|----------|
| **auth** | Login, registro, refresh, reset de senha | Invalida `catalog:stores` no registro | `EmailPublisher` |
| **catalog** | Lojas, produtos, marketplace por slug | Read-through (stores, products, detail) | — |
| **cart** | Carrinho por `userId` + `priceTenantId` | — | — |
| **reservations** | Reserva de estoque com TTL | Via `InventoryService` | `ReservationPublisher` + `ReservationExpiryWorker` |
| **orders** | Confirmar, listar, atualizar status | Listas + detalhe | `OrderPublisher` + `OrderConfirmedWorker` |
| **audit** | Movimentos e resumo de estoque | Movements + summary | — |
| **inventory-management** | CRUD produtos/variantes (vendedor) | Invalida catálogo | — |
| **inventory** | Lock + mutações de estoque | Fire-and-forget invalidation | — |

## Redis

Dois serviços com papéis distintos:

### `RedisService` — infraestrutura

- Cliente `ioredis` (conexão, `getClient()`)
- **Distributed lock** por variant: `inventory:lock:{variantId}`
- Falha fechada: lock indisponível → `400 Bad Request`

### `CacheService` — cache de aplicação

- JSON read-through sobre Redis
- **Best-effort**: falha no Redis → fallback ao Postgres (nunca quebra a request)
- Chaves centralizadas em `CacheKeys`, TTLs em `CACHE_TTL`

| Dado | Chave | TTL | Invalidado por |
|------|-------|-----|----------------|
| Lista de lojas | `catalog:stores` | 120s | registro, mutação de estoque/CRUD |
| Produtos do vendedor | `catalog:products:{seller}` | 30s | estoque, CRUD |
| Marketplace (buyer) | `catalog:store:{seller}:{buyer}` | 30s | pattern delete |
| Produto individual | `catalog:product:{id}:{seller}` | 30s / 10s (404) | pattern delete |
| Audit movements | `audit:movements:{tenant}:{limit}` | 30s | mutação de estoque |
| Audit summary | `audit:summary:{tenant}` | 30s | mutação de estoque |
| Pedidos (comprador) | `orders:list:{tenant}:{user}` | 60s | confirm, status |
| Pedidos (vendedor) | `orders:incoming:{seller}` | 60s | confirm, status |
| Detalhe do pedido | `orders:detail:{id}:{tenant}` | 60s | status |

**Invalidação após estoque** — fire-and-forget em `InventoryService` (não bloqueia a resposta HTTP). Demais paths (`OrdersService`, `AuthService`, `InventoryManagementService`) aguardam a invalidação.

**Limitações conhecidas (projeto de estudo):**

- `delByPattern` usa SCAN — não-atômico com writes concorrentes
- Sem singleflight — cache miss simultâneo pode gerar thundering herd no Postgres
- `totalStock` editado manualmente no CRUD não passa por `InventoryService` (sem `StockMovement`)

## RabbitMQ

### Arquitetura

```
RabbitMqService (infra genérica: publish/consume/retry/DLQ)
       │
       ├── ReservationPublisher  → reservation.expiry  → ReservationExpiryWorker
       ├── EmailPublisher        → email.send          → EmailWorker
       └── OrderPublisher        → order.confirmed     → OrderConfirmedWorker
```

Nomes das filas: `infrastructure/rabbitmq/queues.ts` (fonte única de verdade).

| Fila | Payload | Producer | Consumer |
|------|---------|----------|----------|
| `reservation.expiry` | `{ reservationId }` | `ReservationPublisher` | `ReservationExpiryWorker` |
| `email.send` | `{ type, to, resetUrl }` | `EmailPublisher` | `EmailWorker` |
| `order.confirmed` | `{ orderId, buyerTenantId, sellerTenantIds }` | `OrderPublisher` | `OrderConfirmedWorker` |
| `failed.messages` (DLQ) | — | retry automático | inspeção manual |

### Degradação graciosa

Se o RabbitMQ estiver indisponível no boot:

- API sobe normalmente (`isReady = false`)
- Publishers logam warning e não enfileiram
- Reservas: expiração via **sweeper** em `GET /reservations` (`expireStaleReservations`)
- E-mails: não enviados até o broker voltar

### Retry + DLQ

Consumer genérico em `RabbitMqService.consume()`:

- `prefetch(1)` — backpressure
- Até 3 retries com backoff exponencial (2s, 4s, 8s)
- Após esgotar retries → `nack` → DLX `failed.messages`

### Limitações conhecidas

- **Expiração de reserva**: `expiration` em fila clássica não agenda entrega futura de forma confiável. O mecanismo real é o sweeper no GET. Em produção: plugin `rabbitmq_delayed_message_exchange` ou cron dedicado.
- **Workers no mesmo processo da API** — escala HTTP e consumers juntos. Em produção: processo worker separado.
- **`confirmOrder`**: pedido + reservas `CONVERTED` em transação; `confirmStock` roda depois em loop — falha parcial possível (trade-off documentado).

## Fluxos críticos

### Reserva de estoque

```
POST /reservations/from-cart
  → InventoryService.reserveStock (Redis lock + StockMovement RESERVE)
  → ReservationPublisher.publishExpiry (best-effort)
  → Cache invalidation (fire-and-forget)
```

### Expiração de reserva

```
ReservationExpiryWorker (tentativa via fila)
  OU
GET /reservations → expireStaleReservations (sweeper — fonte confiável)
  → updateMany ACTIVE→EXPIRED (atômico, idempotente)
  → InventoryService.releaseReservedStock (RELEASE)
```

### Confirmação de pedido

```
POST /orders/confirm
  → $transaction: Order + reservations CONVERTED
  → loop: InventoryService.confirmStock (SALE) — fora da transação
  → cache invalidation (orders)
  → OrderPublisher.publishConfirmed
```

### Reset de senha

```
POST /auth/forgot-password
  → token no banco
  → EmailPublisher → email.send → EmailWorker → SMTP (MailHog)
```

## Variáveis de ambiente

Ver `.env.example` na raiz do monorepo. Principais:

| Variável | Default | Uso |
|----------|---------|-----|
| `DATABASE_URL` | — | PostgreSQL via Prisma |
| `REDIS_URL` | `redis://localhost:6379` | Lock + cache |
| `RABBITMQ_URL` | `amqp://order_system:...@localhost:5672` | Filas assíncronas |
| `RESERVATION_TTL_SECONDS` | `900` (15 min) | TTL da reserva no banco |
| `JWT_SECRET` | — | HMAC do access/refresh token |
| `SMTP_*` | MailHog `1025` | E-mails (worker assíncrono) |

## Contratos compartilhados (`@repo/shared`)

Tipos de request/response da API vivem em `packages/shared/src/contracts/`. A API usa classes Swagger que `implement` essas interfaces; o web importa os mesmos tipos nos `services/`.

```
packages/shared/src/
├── schemas/    → Zod (validação runtime)
├── types/      → domínio (UserRole, JwtPayload, etc.)
└── contracts/  → DTOs HTTP (auth, catalog, cart, orders, ...)
```

## Estender o sistema

### Nova fila RabbitMQ

1. Adicionar em `queues.ts` → `QUEUES` + `BUSINESS_QUEUES`
2. Criar `*Publisher` no módulo de domínio
3. Criar `*Worker` se houver consumer
4. Registrar provider no módulo NestJS

### Novo endpoint com cache

1. Definir chave em `CacheKeys` + TTL em `CACHE_TTL`
2. Read-through: `cache.get` → DB → `cache.set`
3. Invalidar nas mutações que alteram o dado

### Regras invariantes

- Estoque em runtime: **sempre** via `InventoryService` (lock Redis)
- `tenantId` em toda query/guard
- Schemas compartilhados em `@repo/shared`
- Cache é enhancement — Postgres é source of truth
