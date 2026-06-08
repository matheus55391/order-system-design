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
  shared/    → Types e schemas Zod compartilhados
```

### Multi-tenancy

Cada usuário pertence a um `tenant`. O JWT carrega `user_id`, `tenant_id` e `role`. Queries filtram por `tenant_id` do comprador; preços vêm do `priceTenantId` (loja vendedora).

### Fluxo de compra

```
Loja / Marketplace → Carrinho (intenção) → Reserva (TTL + lock) → Pedido (imutável)
```

1. **Carrinho** — itens com `variantId`, `quantity` e `priceTenantId` (sua loja ou outra)
2. **Reservar estoque** — `POST /reservations/from-cart` bloqueia estoque com TTL
3. **Redis lock** — serializa updates de inventário por variant
4. **RabbitMQ** — agenda expiração da reserva
5. **Confirmar pedido** — converte reserva, debita `totalStock` e `reservedStock`
6. **StockMovement** — ledger de auditoria (`RESERVE`, `RELEASE`, `SALE`)

### Marketplace

- **Minha loja** (`/store`) — catálogo com preços do seu tenant
- **Marketplace** (`/marketplace`) — comprar de outras lojas com preços do tenant vendedor

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
- RabbitMQ Management: http://localhost:15672 (order_system / order_system)
- MailHog (e-mails dev): http://localhost:8025
- MinIO API: http://localhost:9000 · Console: http://localhost:9001

## Contas de demonstração

| E-mail | Tenant | Senha |
|--------|--------|-------|
| buyer@acme.com | Acme Corp | password123 |
| admin@acme.com | Acme Corp | password123 |
| buyer@globex.com | Globex Industries | password123 |

Teste marketplace: login como `buyer@acme.com` e compre na loja Globex (preços diferentes).

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
  components/  → UI, layouts, guards
  context/     → providers React (QueryClient, toasts)
  lib/         → API client, utils
  schema/      → schemas Zod (forms)
  store/       → Zustand (sessão global)
```

## Agentes Cursor

[`.cursor/AGENTS.md`](.cursor/AGENTS.md) (guia) + [`.cursor/rules/project.mdc`](.cursor/rules/project.mdc) (regra automática).

## Path aliases

- `apps/web`: `@/*` → `src/*`
- `apps/api`: `@/*` → `src/*`
- Pacotes compartilhados via `@repo/database` e `@repo/shared`
