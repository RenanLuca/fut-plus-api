---
name: commit
description: Stage and create small, well-organized commits split by feature, with short commit messages. Invoke when you want to commit the current changes.
disable-model-invocation: true
allowed-tools: Bash(git status *) Bash(git diff *) Bash(git add *) Bash(git commit *) Bash(git log *)
---

Your job is to turn the current uncommitted changes into small, well-organized
commits, not one giant commit.

1. Run `git status` and `git diff` to see everything that changed.
2. Group the changes logically by feature or concern. Never mix unrelated
   changes (e.g. a new endpoint and an unrelated bug fix) in the same commit.
3. If the changes clearly belong to more than one feature, split them into
   multiple commits, staging only the relevant files or hunks for each one
   with `git add`.
4. Write short, direct commit messages in the imperative mood (e.g. "add
   match creation endpoint", not "added" or "adding"). No fluff, no
   explanations in the subject line. One line is enough unless a commit truly
   needs a short body to explain why, not what.
5. Show me each proposed commit (files + message) before creating it.
6. If it's genuinely unclear how to split the changes into features, ask me
   instead of guessing.
7. Never add a "Co-Authored-By" line or any AI attribution/signature to the
   commit message. The commit message should look exactly like one a human
   wrote by hand.

Gotchas:
- A module's controller/service/dto/module changing together for the SAME
  feature are one commit, not four — don't over-split a cohesive change
- A `prisma/schema.prisma` change and its generated migration file are one
  commit together, never split
- If `git status` shows changes in unrelated areas (e.g. a stray formatting
  change from the editor, or `generated/prisma` churn from an unrelated
  `prisma generate`), flag it and ask before including it

IMPORTANT: never commit unrelated changes together just to save time. Small,
readable history matters more than speed here.
