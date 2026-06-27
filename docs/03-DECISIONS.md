# Ma Boutique — Decision Log

> Every non-obvious decision, with the reasoning, so future-us (and the developer)
> can see *why*, not just *what*. Newest first.

---

## D-008 · Repo = new dedicated project `/home/user/ma-boutique`
**Decision:** The new software is a brand-new project in its own directory/repository,
fully separate from the old `Store-management` repo (which is reference-only).
**Reasoning:** Developer was explicit: the old repo is the old, abandoned software; we are
building brand-new software. Planning docs + approved prototype were copied into the new repo.

## D-007 · Data layer = built-in `node:sqlite` (not Prisma/Postgres) for now
**Decision:** Use Node 22's built-in `node:sqlite` with a thin, abstracted data-access layer
instead of Prisma + PostgreSQL.
**Reasoning:** Prisma's engine-binary download (`binaries.prisma.sh`) fails repeatedly with
`ECONNRESET` through the environment proxy, blocking install and `generate`. `node:sqlite`
ships with Node — zero downloads, fully reliable here, and SQLite is proven adequate for a
single small boutique (the old app ran on SQLite). The data layer is kept behind a small
repository module so production can move to hosted SQLite (Turso/libSQL) or Postgres later
without touching feature code.
**Deploy note:** for serverless (Vercel) we'd use Turso/libSQL; for a persistent host
(Render/Fly/VPS) a SQLite file on disk is fine. Either way, multi-device = one hosted server.

## D-006 · Repo structure: same repo vs new repo  — OPEN (needs developer input)
**Question:** Should Ma Boutique live in the existing `rapetoh/Store-management` repo
(currently in the `boutique/` subdirectory, with the old StockFlow app still at the root),
or in a brand-new dedicated GitHub repository?
**Context:** "From zero" so far means a fresh *app/codebase*, not a fresh *repository* —
we've been committing to branch `claude/inspiring-tesla-fobaq9` of the existing repo.
**Options:**
- (A) **New dedicated repo** (e.g. `ma-boutique`): cleanest separation, history is only this
  product, no confusion with the abandoned app. Recommended if this fully replaces StockFlow.
- (B) **Same repo, `boutique/` subdir:** keeps the old app side-by-side as reference; one place.
- (C) **Same repo, replace root:** archive old app to a folder, make Ma Boutique the main app.
**Status:** awaiting developer decision. Leaning (A) for a clean break.

## D-005 · Push/write blocked by 403 — environmental, not a code issue
**Decision:** Treat the failed push as a permissions blocker to be resolved by the developer;
do not retry/route around it (per environment policy on 403s).
**Reasoning:** Both `git push` (git relay) and the GitHub API return 403
("Resource not accessible by integration"). The session's GitHub integration lacks
write/contents permission on the repo. Work continues locally and is committed; it will be
pushed once access is granted.

## D-004 · Prototype in real stack, not Canva
**Decision:** Build the visual prototype as real front-end (HTML/CSS that ports to the app),
not Canva mockups.
**Reasoning:** Canva is marketing/template oriented and throwaway; a real-stack prototype is
faithful to web reality and becomes the actual product. Canva reserved for an optional
logo/brand mark later.

## D-003 · Build truly from zero
**Decision:** New app, fresh stack, nothing copied from StockFlow. Old app kept as a
documented record of what failed.
**Reasoning:** Explicit developer instruction; also the cleanest way to shed the old app's
wrong baked-in assumptions (forced cash session, immutable records, barcode-first, bloat).

## D-002 · Anti-theft = owner-records + fast stock count; employee sell-role built but off
**Decision:** The owner records sales for now. The anti-theft mechanism is a fast periodic
Contrôle de stock (expected vs counted → écart). A sell-only employee role (no margins, no
edits, no deletes) is built but kept disabled until she trusts the next hire.
**Reasoning:** No app can catch a sale nobody typed. Detection (stock count) works day one;
true prevention (employee records at the counter) is ready when she is, and the restricted
role makes handing over the computer safer than today.

## D-001 · Mobile money = light reconciliation, not transaction logging
**Decision:** Model money as a few Comptes (Espèces, TMoney, Flooz, Crédit); she enters
balances and the app reconciles ("ça tombe juste ?"). No per-deposit/withdrawal logging.
**Reasoning:** Her #1 need (does the money add up) is meaningless without the phone floats,
but full transaction logging is the overload that killed app #1. Light is the right altitude.
