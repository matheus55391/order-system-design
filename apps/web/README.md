# Web — Order System

Frontend Next.js da plataforma B2B.

## Estrutura `src/`

```
src/
  app/         → rotas e layouts (App Router)
  components/  → UI, layouts, guards
  context/     → providers (TanStack Query, Sonner)
  lib/         → API client, utils
  schema/      → schemas Zod para React Hook Form
  store/       → Zustand (sessão JWT)
```

## Path alias

`@/*` → `src/*`

## Desenvolvimento

```bash
pnpm dev:web
```

Abre em http://localhost:3000
