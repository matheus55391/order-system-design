# Order System Design

Monorepo de estudo em system design B2B: plataforma multi-tenant com marketplace, concorrência de estoque, reservas temporárias e pedidos transacionais.

## Stack

| Camada | Tecnologias |
|--------|-------------|
| Frontend | Next.js, Shadcn UI, TanStack Query, React Hook Form, Zod, Zustand |
| Backend | NestJS, JWT próprio (sem libs de auth), Prisma, PostgreSQL |
| Infra local | Docker Compose — PostgreSQL, Redis, RabbitMQ, MinIO, MailHog |

## Arquitetura

```
apps/
  api/     → NestJS (auth, catálogo, carrinho, reservas, pedidos, auditoria)
  web/     → Next.js (loja, marketplace, carrinho, pedidos)
packages/
  database/  → Prisma schema + client
  shared/    → Types, schemas Zod e contratos API (DTOs)
```

### Multi-tenancy

Cada conta representa uma **empresa** (1 usuário = 1 tenant). No cadastro, informar o nome da empresa cria o tenant automaticamente. O JWT carrega `user_id`, `tenant_id` e `role`. Preços no marketplace vêm do `priceTenantId` da loja vendedora.

### Fluxo de compra

```
Loja / Marketplace → Carrinho (intenção) → Reserva (TTL + lock) → Pedido (imutável)
```

1. **Carrinho** — por loja vendedora (`userId` + `priceTenantId`); itens com `variantId`, `quantity`
2. **Reservar estoque** — `POST /reservations/from-cart` bloqueia estoque com TTL
3. **Redis lock** — serializa updates de inventário por variant
4. **RabbitMQ** — tentativa de expiração assíncrona; **sweeper** em `GET /reservations` como fallback confiável
5. **Confirmar pedido** — converte reserva, debita `totalStock` e `reservedStock`
6. **StockMovement** — ledger de auditoria (`RESERVE`, `RELEASE`, `SALE`)

### Cache (Redis)

Read-through com fallback ao Postgres — cache é enhancement, não requisito.

| Camada | Serviço | Papel |
|--------|---------|-------|
| Lock | `RedisService` | Serializa mutações de estoque por variant |
| Cache | `CacheService` | Catálogo, pedidos, audit (TTL 30–120s) |

Invalidação ativa após mutações. Detalhes: [`apps/api/README.md`](apps/api/README.md#redis).

### Mensageria (RabbitMQ)

Publishers e workers separados por domínio; `RabbitMqService` só cuida de infraestrutura.

| Fila | Uso |
|------|-----|
| `reservation.expiry` | Expiração de reserva (worker + sweeper fallback) |
| `email.send` | E-mails assíncronos (ex.: reset de senha) |
| `order.confirmed` | Evento pós-confirmação (extensível: notificar vendedor) |

Se o broker estiver indisponível, a API sobe normalmente e operações críticas usam fallback síncrono. Detalhes: [`apps/api/README.md`](apps/api/README.md#rabbitmq).

### Marketplace

- **Minha loja** (`/store`) — catálogo com preços do seu tenant
- **Marketplace** (`/marketplace`) — comprar de outras lojas com preços do tenant vendedor

### Carrinho (limitação intencional)

O carrinho fica no **ícone à direita do header**, visível apenas ao navegar em uma loja do marketplace (`/marketplace/[slug]`). Checkout em `/marketplace/[slug]/cart`.

**Um carrinho por loja vendedora** — simplificação deliberada do projeto:

- Cada par comprador + loja vendedora tem seu próprio carrinho (`userId` + `priceTenantId`)
- **Não é possível** misturar itens da Loja B e da Loja C no mesmo checkout
- Para comprar de outra loja: voltar ao marketplace, escolher o fornecedor — o carrinho daquela loja estará lá (persistido separadamente)
- Reserva e confirmação de pedido são sempre **por loja**
- Compras da própria loja não usam carrinho — fluxo exclusivo do marketplace

Em produção, daria para unificar carrinhos multi-fornecedor ou sincronizar sessões; aqui o modelo por loja reduz complexidade de UI, reservas e fulfillment.

### Imagens (MinIO)

Produtos usam a mesma imagem padrão (produto sem modelo) em `packages/database/seed-assets/default-product.webp`, servida via MinIO em `http://localhost:9000/products/default-product.webp`. Após subir o Docker:

```bash
pnpm minio:setup
```

Console MinIO: http://localhost:9001 (order_system / order_system)

## Setup

### 1. Infraestrutura

```bash
cp .env.example .env
pnpm docker:up
pnpm minio:setup
```

### 2. Dependências

```bash
pnpm install
```

### 3. Banco de dados

```bash
pnpm db:setup
```

### 4. Desenvolvimento

```bash
pnpm dev
```

- Web: http://localhost:3000
- API: http://localhost:3001
- Swagger: http://localhost:3001/docs
- RabbitMQ Management: http://localhost:15672 (order_system / order_system)
- MailHog (e-mails dev): http://localhost:8025
- MinIO API: http://localhost:9000 · Console: http://localhost:9001

## Contas de demonstração

| E-mail | Empresa | Senha |
|--------|---------|-------|
| loja-alfa@demo.com | Loja Alfa | password123 |
| loja-beta@demo.com | Loja Beta | password123 |

Teste marketplace: login como Loja Alfa e compre na Loja Beta (preços diferentes).

Cadastro (`/register`): cria uma nova empresa + usuário admin automaticamente.

## Scripts úteis

```bash
pnpm dev:api          # apenas backend
pnpm dev:web          # apenas frontend
pnpm db:studio        # Prisma Studio
pnpm minio:setup      # bucket products + imagens de exemplo
pnpm lint             # ESLint em todo o monorepo
pnpm check-types      # TypeScript strict
```

## Frontend (`apps/web/src/`)

```
src/
  app/         → rotas Next.js (App Router)
  components/  → UI shadcn, layouts, guards
  context/     → providers React (QueryClient, toasts)
  lib/         → API client bootstrap, utils
  store/       → Zustand (sessão global)
```

Data access: clients HTTP em `@repo/shared/data-access` (`authService`, `cartService`, etc.). Bootstrap do web em `lib/data-access.ts` (wire Zustand + axios). Tipos e schemas em `@repo/shared`.

## Documentação da API

[`apps/api/README.md`](apps/api/README.md) — módulos, cache, RabbitMQ, fluxos críticos e como estender.

## Agentes Cursor

[`.cursor/AGENTS.md`](.cursor/AGENTS.md) (guia) + [`.cursor/rules/project.mdc`](.cursor/rules/project.mdc) (regra automática).

## Path aliases

- `apps/web`: `@/*` → `src/*`
- `apps/api`: `@/*` → `src/*`
- Pacotes compartilhados via `@repo/database` e `@repo/shared`
