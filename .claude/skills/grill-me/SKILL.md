---
name: grill-me
description: Before drafting any implementation plan, identify the open technical decisions and ask the user instead of deciding alone. Always use this before implementing a new feature.
---

Before writing any plan or code, analyze the request and identify ALL the
points where there is more than one reasonable way to solve the problem.
This includes, but is not limited to:

- Data modeling (Prisma schema fields, relations, nullable vs required,
  whether something is a new model or a field on an existing one)
- Where business logic lives (existing module vs new module, one service
  vs splitting into `services/`)
- Guard/authorization requirements (does this route need
  `GroupOwnerGuard`, a new guard, or is `@IsPublic()` actually correct
  here?)
- Choice of library or technical approach, when more than one reasonable
  option exists
- Error handling and edge cases (what happens for the guest-user case
  described in `.claude/rules/domain-model.md`, what HTTP status a
  failure case should return)
- Naming of routes, DTOs, repository methods
- Migration strategy for a schema change that touches the shared remote
  database (backfill needed? nullable-then-required in two steps?)

For each decision point found, formulate a clear question with 2-3 concrete
options, and explain the trade-off of each option in 1-2 sentences, so I can
decide with information, not blindly. Don't ask open-ended questions
("how do you want me to do this?") - always offer the real options you
identified.

Ask all the questions at once, numbered, and wait for my answers before
continuing.

IMPORTANT RULE: don't decide anything on your own "to save time", even a
small decision. If there's more than one reasonable way to do it, that's my
decision, not yours. Only after I answer all the questions, build the plan
incorporating exactly the choices I made.

Gotchas:
- Don't re-ask something already settled by `CLAUDE.md` or `.claude/rules/`
  — check those first, only ask what's genuinely undecided
- Don't bundle a real architectural decision with a trivial one just to
  look thorough — trivial naming inside an already-decided pattern doesn't
  need a question
