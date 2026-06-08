# Order System Design

Monorepo de estudo em system design B2B: plataforma multi-tenant com concorrência de estoque, reservas temporárias e pedidos transacionais.

## Stack

| Camada | Tecnologias |
|--------|-------------|
| Frontend | Next.js, Shadcn UI, TanStack Query, React Hook Form, Zod, Zustand |
| Backend | NestJS, JWT próprio (sem libs de auth), Prisma, PostgreSQL |
| Infra local | Docker Compose — PostgreSQL, Redis, RabbitMQ |

## Arquitetura

```
apps/
  api/     → NestJS (auth, catálogo, carrinho, reservas, pedidos)
  web/     → Next.js (UI B2B)
packages/
  database/  → Prisma schema + client
  shared/    → Types e schemas Zod compartilhados
```

### Multi-tenancy

Cada usuário pertence a um `tenant`. O JWT carrega `user_id`, `tenant_id` e `role`. Todas as queries do backend filtram por `tenant_id`.

### Concorrência de estoque

1. **Adicionar ao carrinho** → cria `Reservation` com TTL + incrementa `reservedStock`
2. **Redis lock** → serializa updates de inventário por variant
3. **RabbitMQ** → agenda expiração da reserva
4. **Confirmar pedido** → converte reserva, debita `totalStock` e `reservedStock`
5. **Expiração/cancelamento** → libera `reservedStock`

### Estados de pedido

`PENDING` · `CONFIRMED` · `CANCELED` · `EXPIRED` — imutáveis após criação.

## Setup

### 1. Infraestrutura

```bash
cp .env.example .env
pnpm docker:up
```

### 2. Dependências

```bash
pnpm install
```

### 3. Banco de dados

```bash
pnpm db:generate
pnpm db:push
pnpm db:seed
```

### 4. Build dos pacotes compartilhados

Os pacotes `@repo/shared` e `@repo/database` são compilados para `dist/` antes do backend subir (automático via `predev`/`prebuild`).

```bash
pnpm --filter @repo/shared --filter @repo/database run build
```

### 5. Desenvolvimento

```bash
pnpm dev
```

- Web: http://localhost:3000
- API: http://localhost:3001
- RabbitMQ Management: http://localhost:15672 (order_system / order_system)
- MailHog (e-mails dev): http://localhost:8025

## Contas de demonstração

| E-mail | Tenant | Senha |
|--------|--------|-------|
| buyer@acme.com | Acme Corp | password123 |
| admin@acme.com | Acme Corp | password123 |
| buyer@globex.com | Globex Industries | password123 |

## Scripts úteis

```bash
pnpm dev:api          # apenas backend
pnpm dev:web          # apenas frontend
pnpm db:studio        # Prisma Studio
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
