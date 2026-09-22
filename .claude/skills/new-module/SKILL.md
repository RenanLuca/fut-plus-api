---
name: new-module
description: Scaffold a new NestJS feature module following the project's controller/service/dto/repository layering. Use when the user asks to create a new module or feature.
---

Read `.claude/rules/architecture.md` and `.claude/rules/naming-conventions.md`
before doing anything.

1. If the feature's data shape, routes, and auth requirements aren't
   already clear from the conversation, invoke the same questioning style
   as `/grill-me` first: what data does it own, does it need a new Prisma
   model or reuse an existing one, which routes does it expose, does it
   need group-scoped authorization.

2. If a new Prisma model is needed, that's a schema change against the
   shared remote database — confirm with the user before running
   `npx prisma migrate dev`, per the project's database rule.

3. Scaffold under `src/modules/<feature>/`:
   - `<feature>.module.ts` — wires controller + service(s) + guards
   - `<feature>.controller.ts` — routes only, delegates to the service
   - `<feature>.service.ts` — business logic, injects the repository
     (create the repository in `src/shared/database/repositories/` first
     if one doesn't exist yet for the relevant Prisma model)
   - `dto/` — one file per request DTO, with `class-validator` decorators
     matching the real constraints
   - `guards/` — only if the module needs a guard beyond the global
     `AuthGuard` (e.g. an ownership check like `GroupOwnerGuard`)

4. If the module ends up needing more than one service (a distinct
   secondary responsibility, not just a big file), move all services into
   `services/` per `architecture.md` — don't do this preemptively for a
   module that only needs one.

5. Register the module in `app.module.ts`'s imports if it isn't
   auto-registered by the Nest CLI schematic used to scaffold it.

6. Never call `PrismaClient`/`PrismaService` from the service directly —
   always through the repository, and repository methods take Prisma's
   `*Args` types as parameters.

7. Show the full file tree of what you're about to create before writing
   any file, and wait for confirmation.

Gotchas:
- Don't create `services/` or `guards/` as empty speculative folders —
  only create them when there's a real file to put inside
- Don't invent a new DTO naming style — check the existing modules'
  `dto/` folders and match whichever convention is already in use nearby
  (see the note in `naming-conventions.md` about the two DTO casing
  styles currently in the codebase)
