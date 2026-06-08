# Agentes

Plataforma B2B multi-tenant com concorrência de estoque. Detalhes em `.cursor/rules/project.mdc`.

## Stack

- **web** (3000): Next.js, Shadcn, TanStack Query, RHF, Zod, Zustand
- **api** (3001): NestJS, JWT próprio, Prisma, Redis, RabbitMQ
- **packages**: `database` (Prisma), `shared` (types/Zod)

## Comandos

```bash
pnpm docker:up && pnpm db:setup && pnpm dev
```

Demo: `buyer@acme.com` / `password123`

## Roles (use no prompt quando necessário)

| Foco | Orientação |
|------|------------|
| **Fullstack** | shared → API module → `lib/api.ts` → page web |
| **Backend** | Guards JWT, `@CurrentUser()`, `InventoryService` para estoque |
| **Frontend** | `src/app`, `@/store`, `@/schema`, TanStack Query |
| **Database** | `packages/database/prisma`, `pnpm db:push` / `db:seed` |
| **Reviewer** | tenant_id em toda query, estoque só via lock, pedidos imutáveis |
