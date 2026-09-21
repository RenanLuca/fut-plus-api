# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Modo de trabalho neste projeto

Este é um projeto de estudo, não só de entrega. Antes de implementar qualquer
feature nova:

1. Explica o plano em português antes de escrever qualquer código
2. Não implementa direto - espera minha aprovação do plano primeiro
3. Depois de implementar, explica o "porquê" das decisões técnicas tomadas,
   não só o "o quê"
4. Se eu pedir pra tentar sozinho uma parte, não me dá a solução, só aponta
   pistas ou erros do que eu escrevi
5. Prefere mudanças pequenas e incrementais a features grandes de uma vez,
   pra eu conseguir acompanhar cada diff

## Commands

```bash
npm run start:dev              # dev server with watch mode
npm run build                    # prisma generate + nest build
npm run lint                       # eslint --fix over src/apps/libs/test
npm run format                       # prettier --write on src/**/*.ts and test/**/*.ts
npm run test                           # jest unit tests
npm run test:watch                       # jest --watch
npm run test:cov                           # jest with coverage
npm run test:e2e                             # jest -c test/jest-e2e.json
npx jest path/to/file.spec.ts                  # run a single test file
npx jest -t "test name"                          # run tests matching a name
npx prisma migrate dev                             # create/apply a migration after editing schema.prisma
npx prisma generate                                  # regenerate the Prisma client into generated/prisma
```

This is a standalone NestJS project (no root workspace) — run all commands from inside
`api/`. The frontend lives in a sibling `front-end/` directory (separate Vite project,
not part of this build).

The Prisma client is generated to `api/generated/prisma` (not `node_modules`), so run
`npx prisma generate` after pulling schema changes or it will be stale.

### Environment

`.env` requires `DATABASE_URL` (Postgres connection string) and `JWT_SECRET` (see
`.env.example`); validated at boot in `src/shared/config/env.ts` — the app throws on
startup if either is missing.

## Architecture

Standard NestJS layering, applied consistently across every feature module under
`src/modules/<feature>/`:

- `*.controller.ts` — HTTP routes, request/response shape only
- `*.service.ts` (often under `services/`) — business logic, orchestrates repositories
- `dto/*.dto.ts` — class-validator/class-transformer request DTOs
- `*.module.ts` — wires controller + services + guards for that feature

Data access is centralized in `src/shared/database/repositories/`, one repository per
Prisma model, injected via the `@Global()` `DatabaseModule`
(`src/shared/database/database.module.ts`). Services never call `PrismaClient`
directly — they go through the matching repository, and repository methods take
Prisma's own `*Args` types (e.g. `Prisma.GroupFindManyArgs`) as parameters rather than
hand-rolled filter DTOs.

**Auth**: `AuthGuard` (`src/modules/auth/auth.guard.ts`) is registered globally via
`APP_GUARD` in `app.module.ts`, so every route requires a valid JWT bearer token by
default. Opt out per-route/controller with the `@IsPublic()` decorator
(`src/shared/decorators/IsPublic.ts`). Inside a handler, get the authenticated user's id
with the `@ActiveUserId()` param decorator, which reads `request.userId` (set by the
guard from the JWT payload's `sub` claim) — see `src/shared/decorators/ActiveUserId.ts`.

**Group-scoped authorization**: routes that act on a specific group additionally use
`GroupOwnerGuard` (`src/modules/groups/guards/group-owner.guard.ts`), which checks
`request.params.groupId` against `request.userId` via `GroupsService`.

**Domain model** (`prisma/schema.prisma`): a `Group` has recurring `GroupMatch`es
(weekly, `EVENTUAL` or `MONTHLY` frequency) attended by `GroupMember`s, who are either a
registered `User` or a `GuestUser` — this dual-membership pattern (`userId` XOR
`guestUserId`, both nullable FKs) repeats across `GroupMember`, `GroupMatchPresence`,
`MatchTeamPlayer`, so most services/repositories dealing with match participants handle
both id types. Matches get split into `MatchTeam`s of `MatchTeamPlayer`s, and
`GroupPayment` tracks per-user, per-period dues (optionally tied to a specific match).

Two pieces of non-obvious business logic worth reading before touching related code:
- `src/modules/group-matches/services/group-matches-scheduler.service.ts` — a midnight
  cron (`America/Sao_Paulo` timezone) that auto-generates the next upcoming match for
  every `MONTHLY` group whose weekday falls N days out, using
  `src/shared/utils/brazil-date.ts` for Brazil-local date math.
- `src/modules/match-teams/utils/match-teams-balancer.ts` — balances confirmed players
  into teams by grouping on `Position` then snake-drafting by `Rank` weight so strong
  players don't stack on one team.

Path alias: `@src/*` → `src/*` (see `tsconfig.json`).
