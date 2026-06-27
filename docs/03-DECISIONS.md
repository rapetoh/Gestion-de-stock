# Ma Boutique — Decision Log

> Every non-obvious decision, with the reasoning, so future-us (and the developer)
> can see *why*, not just *what*. Newest first.

---

## D-012 · Soldes = balances-only reconciliation (attendu vs compté), commissions deferred
**Decision:** The daily money check models **balances**, not transactions. Per account she enters
`attendu` (capital/float that should be there) and `compté` (actual); the app flags the écart
("ça tombe juste" / "il manque X"). One record per account per day (re-save replaces); `attendu`
carries forward to uncounted days. Mobile-money **commissions as income** are deferred to a later
follow-up (fold into Bénéfices), not built now.
**Reasoning:** This is exactly her described ritual (cash + TMoney + Flooz vs deposited capital →
perte). Per-transaction logging is the overload that killed app #1, so it stays out — confirms the
"light" altitude of D-001 with a concrete shape. Stored `attendu` alongside `solde` (new
`solde_journalier.attendu` column, idempotent migration) so history shows an accurate écart even
as the capital changes over time. Commissions deferred to keep the daily form light; documented so
it isn't lost. (Phase D / Roadmap Phase 4.)

## D-011 · Dépenses = a manual ledger; marge réelle = marge − dépenses (shown in Bénéfices)
**Decision:** Dépenses is a simple editable ledger (libellé, montant, catégorie, date, "revient
chaque mois" flag). The Bénéfices page subtracts the month's total dépenses from the goods margin
to show **marge réelle**. Amortissement, OTR and Mairie are entered as ordinary periodic lines —
the app does **not** compute depreciation schedules or tax formulas; the "recurring" flag is a
label/reminder, not an auto-poster (yet).
**Reasoning:** This is exactly how she already does it by hand (she "affects a monthly sum" for
furniture amortization and divides last year's tax across months). A manual ledger matches her
mental model and avoids over-engineering; auto-recurring posting can come later if she wants it.
Dates use plain calendar days — the Togo is at GMT so local day = UTC, no timezone drift in
month buckets. (Phase C / Roadmap Phase 3.)

## D-010 · Contrôle de stock corrects stock and keeps the écart in history
**Decision:** Recording a stock count (a) values each écart at **coût de revient unitaire**
(`prix_achat + frais`), (b) **corrects the system stock to what was counted**, and (c) keeps the
original théorique/compté/écart forever in `ligne_controle` + a `mouvement_stock` row of type
`controle`. Only products she actually counts are recorded (blank = skipped), so it works for a
full inventory **or** a quick spot-check of a few products.
**Reasoning:** She needs the stock to become *true* going forward (so future counts mean something)
**and** to keep the evidence of what was short (the theft signal) even after the fix. Valuing at
cost = her real money lost. Spot-check support matches how she actually works ("6 bought, 4 sold, 2
gone"), not an all-or-nothing inventory. (Phase B / Roadmap Phase 2.)

## D-009 · `node:sqlite` via `process.getBuiltinModule` + lazy, retrying connection
**Decision:** Load `node:sqlite` with `process.getBuiltinModule("node:sqlite")` (not
`createRequire`, not a static import); open the DB **lazily on first query** (not at module import);
set `PRAGMA busy_timeout = 5000` before other pragmas/migrate.
**Reasoning:** Under this Next 16 (Turbopack) + Node 25 environment the previous `createRequire`
trick threw `Unsupported external type Url for commonjs reference`, 500-ing every page in dev and
breaking `next build`. `getBuiltinModule` is a plain property access the bundler never transforms.
Connecting at import meant `next build`'s 13 parallel page-data workers each ran `migrate()` on the
same file → `database is locked`; lazy connect + busy_timeout fixes it. Confirmed pre-existing
(reproduced on a clean tree), not introduced by feature work. Net: `next dev` and `next build` both
clean. Supersedes the loading mechanism noted in D-007 (the `node:sqlite` choice itself stands).

## D-008 · Repo = new dedicated project (`Gestion-de-stock`, local `~/Downloads/ma-boutique`)
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
**Status:** **RESOLVED (2026-06-27)** — chose (A). Ma Boutique now lives in its own repo
`Gestion-de-stock`; the old `Store-management` repo is reference-only.

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
**Revisit (2026-06-27):** the raw answers show mobile money is ~half her day and her real check
is concrete — cash + TMoney balance + Flooz balance vs **deposited capital** → `perte` if it
doesn't match — plus commissions on selling/buying crédit and network-delayed SMS balances. The
"light" altitude likely needs to be a notch richer than first scoped. To be confirmed with the
developer before Phase D (Roadmap Phase 4). Still *balances-and-reconciliation*, not per-deposit
logging — that overload stays out.
