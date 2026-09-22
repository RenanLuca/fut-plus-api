---
name: new-endpoint
description: Add a new route to an existing NestJS module, following the project's controller/service/repository layering. Use when the user asks to add an endpoint or route to an existing module.
---

Read `.claude/rules/architecture.md` before doing anything.

1. Determine what the endpoint needs:
   - A new DTO (`dto/<name>.dto.ts`) if the request body/query has a shape
     not covered by an existing DTO in that module — match the casing
     style already used in that module's `dto/` folder.
   - A new repository method if the query shape isn't already covered by
     an existing one — accept a Prisma `*Args` type, don't hand-roll a
     filter parameter.
   - A guard: does this route mutate data scoped to a group? If so it
     needs `GroupOwnerGuard` (or the equivalent guard already used by
     sibling routes in that controller). Does it need to be public? Use
     `@IsPublic()` explicitly rather than skipping the guard silently.

2. Add the controller method: route decorator, `@ActiveUserId()` if it
   needs the authenticated user, delegates immediately to the service —
   no business logic in the controller body itself.

3. Add the service method: the actual logic, calling the repository
   (never Prisma/PrismaService directly).

4. If the endpoint touches match participants (presence, team
   assignment), check `.claude/rules/domain-model.md` for the
   dual-membership (`User` vs `GuestUser`) case and handle both.

5. Show the exact diff/files you're about to touch before writing, and
   wait for confirmation if there was any ambiguity in step 1.

Gotchas:
- Don't add a new repository method that duplicates an existing one with
  a slightly different `*Args` shape — extend the call site's `args`
  instead when the existing method already accepts `*Args`
- A read-only endpoint doesn't need a guard beyond the global `AuthGuard`
  unless it exposes another user's private data — don't add
  `GroupOwnerGuard` reflexively to every route in a group-scoped
  controller if the route only reads data the user is already allowed to
  see
