# Agentes

Plataforma B2B multi-tenant com concorrência de estoque. Detalhes em `.cursor/rules/project.mdc`.

## Stack

- **web** (3000): Next.js, Shadcn, TanStack Query, RHF, Zod, Zustand
- **api** (3001): NestJS, JWT próprio, Prisma, Redis (lock + cache), RabbitMQ
- **packages**: `database` (Prisma), `shared` (types/Zod/contratos API)

## Comandos

```bash
pnpm docker:dev:up && pnpm minio:setup && pnpm db:setup && pnpm dev
```

Prod simulado (stack Docker completa): `pnpm docker:dev:down && pnpm docker:prod:up`

Demo: `loja-alfa@demo.com` / `password123` (comprar na Loja Beta via marketplace)

## Backend — referência rápida

| Infra | Arquivo | Uso |
|-------|---------|-----|
| Lock | `RedisService` | Mutations de estoque |
| Cache | `CacheService` + `CacheKeys` | Read-through, best-effort |
| MQ infra | `RabbitMqService` | publish/consume genérico |
| MQ filas | `queues.ts` | Nomes e constantes |
| MQ domínio | `*Publisher` / `*Worker` | Por módulo (email, reservation, order) |

Doc completa: `apps/api/README.md`

## Roles (use no prompt quando necessário)

| Foco | Orientação |
|------|------------|
| **Fullstack** | shared → API module → `lib/api.ts` → page web |
| **Backend** | Guards JWT, `@CurrentUser()`, `InventoryService` para estoque, `CacheService` para cache |
| **Frontend** | `src/app`, `@/store`, `@repo/shared`, `@repo/shared/data-access`, TanStack Query |
| **Database** | `packages/database/prisma`, `pnpm db:setup` / `db:reset` |
| **Reviewer** | tenant_id em toda query, estoque só via lock, pedidos imutáveis |
