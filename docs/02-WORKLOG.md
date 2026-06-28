# Ma Boutique — Work Log

> Chronological record of everything done on this project, newest first.
> This is the "documenting everything" trail. Each entry: what, why, result, next.

---

## 2026-06-27

### Import rendu SOUPLE (en-tête mappé + fichier) — pas un format imposé
- **What:** Reworked the import to stop imposing one rigid column order. Now it reads a **header
  row and maps columns by name** — any order, any subset, synonyms + accents/case tolerant
  (Produit/Nom, Quantité/Stock, Prix de vente/Prix, Catégorie, …); unknown columns ignored; only
  Nom required. A plain list with **no header still works** (positional fallback — nothing breaks).
  Added **file upload** (.csv/.tsv/.txt) that flows through the same parser. The preview now shows
  **"Colonnes reconnues : …"** for transparency.
- **Why:** The dev rightly called out that forcing a non-standard fixed order on a non-technical
  user is bad engineering — support the standard, flexible way (header-mapped CSV, files + paste).
  Recorded as a working principle ([[feedback-flexible-not-rigid]] in memory). Keeps D-016 safety
  (blank = leave, never clobber existing stock).
- **Result:** `npm test` **54/54** (header mapping, synonyms, subset, positional fallback);
  build clean; **browser-verified**: uploading a CSV with reordered/synonym headers fills the
  import and maps correctly.

### Import en masse rendu sûr, cohérent et clair (question du dev)
- **What:** Reviewed the import for flexibility/consistency/clarity. Fixes: a **blank cell now means
  "ne pas toucher"** (never silently 0); an **existing** product is updated **only on the columns
  filled**, and its **stock is never overwritten by import** (managed by Achats/Ventes/Contrôle);
  new products still take their import stock as the opening count. **Export `produits.csv` reordered
  to match the import columns** so export → re-import round-trips. UI: clearer instructions, preview
  shows "inchangé" for existing stock and **warns** about duplicate names in the list and new
  products with no sale price; a "sans changement" count was added. See **D-016**.
- **Why:** Re-importing could silently zero prices or clobber live stock, and export/import column
  orders didn't match — the "import messes up the software" risk the dev flagged.
- **Result:** `npm test` **52/52** (+ blank-safe + stock-protected tests); tsc/build clean; live
  verified (page explains the rules; export header == import columns).

### Verification audit + fixes (P0–P2) — see docs/05-AUDIT-VERIFICATION.md
- **What:** Deep adversarial verification ("is this safe to use daily?"), then fixed every confirmed
  issue. **P0:** (1) **dépenses récurrentes** now actually recur each month — the flag was a no-op,
  silently inflating marge réelle (`lib/repo/depenses.ts`, computed on read, no row duplication);
  (2) **réconciliation** now **calcule** the `attendu` per account (dernier comptage + ventes du
  compte − dépenses espèces), shows the breakdown, stays editable (`lib/repo/comptes.ts`,
  `ReconciliationForm.tsx`) — the marquee anti-theft feature finally does her arithmetic instead of
  asking her to type both numbers; (3) **stock à la caisse** : visible dans le sélecteur + panier,
  avertissement « tu vends plus que le stock » **sans bloquer**, stock négatif signalé
  (`VenteCaisse.tsx`, `stock/page.tsx`). **P1:** restock prévient avant de changer le prix de vente
  (`AchatForm.tsx`); nouveau module **Commissions Mobile Money** (revenu → marge réelle :
  `lib/repo/commissions.ts`, `app/(app)/commissions/*`, intégré à Bénéfices + Sauvegarde CSV);
  **fuseau unifié** Africa/Lomé via `lib/periodes.ts` (tous les modules); **amorçage non destructif**
  (comptes + propriétaire si absents) + mot de passe initial via `OWNER_INITIAL_PASSWORD`, fin du
  mot de passe public (`lib/db.ts`, `scripts/seed.ts`). **P2:** noms produits normalisés
  (`normaliserNom`), saisies négatives → 0 (`parseCFA`), note ventes à crédit, rapports groupés par
  `produit_id` (renommage ne scinde plus la ligne — `benefices.ts`, `stats.ts`), page d'erreur calme
  (`app/(app)/error.tsx`).
- **Why:** Pré-décembre : l'appli doit être fiable au quotidien, sans nombre faux, sans perte de
  données, sans blocage. L'audit a confirmé que P0-1/P0-3/P0-4 et le revenu mobile money manquaient
  encore (les autres points avaient déjà été traités les jours précédents).
- **Result:** `npm test` **50/50** (+15 : récurrentes, réconciliation calculée, fuseau non-UTC,
  groupement, clamp) ; **build de production OK** (16 routes, /commissions incluse) ; **test à chaud**
  de l'appli réelle : auth + toutes les pages 200, et l'« attendu » espèces pré-rempli à 6 250 (ventes
  du jour) — la réconciliation automatique marche bout en bout.
- **Next:** exploitation (hors code) : hébergement à **disque persistant** + **sauvegarde
  automatique hors-site** (P0-2) ; puis **Phase 5 (rôle vendeuse)** avant décembre.

### Fix: stray underlines on links/buttons (missing global link reset)
- **What:** Links (incl. anchors styled as buttons: "Nouvelle vente", "Importer une liste", the
  Sauvegarde downloads, "← Retour"…) showed the browser's default underline — only `.nav-item` had
  `text-decoration: none`. Added a global `a { text-decoration: none; color: inherit }` reset; real
  inline text links now use a `.lien` style (coloured, underline on hover). Verified in headless
  Chrome (button-links and nav now report `underline=none`).
- **Why:** The developer noticed lots of underlined text — it was an unintended default, not a choice.

### Full UX review + P1 fixes (the inline-edit bug and its siblings)
- **What:** Reviewed the whole UX as a senior designer (docs/05-UX-REVIEW.md). Fixed the P1
  cross-cutting frictions: (1) **inline edit** now opens **one row at a time** and **closes
  automatically on save** (Produits/Achats/Ventes/Dépenses — via per-table `*Rows` wrappers that
  own the open row; rows became controlled); (2) **destructive actions** ask for confirmation and
  use a new red `.btn.danger`; (3) **success feedback + reset**: forms and the sales cart clear on
  success and show a short "✓" flash (Ventes cart, Achats/Dépenses/Produits-new/Contrôle/Soldes);
  (4) a shared `SubmitButton` **disables while saving** (no double-submit). 
- **Why:** The developer noticed edit rows stacking and never closing; it was a symptom of patterns
  repeated across screens, plus missing confirmation/feedback throughout.
- **Result:** tsc/lint/build clean; 35 tests still green; all six screens render 200 with the new
  behavior. See docs/05-UX-REVIEW.md for the full findings list.
- **P2 (done, same day):** responsive layout — a hamburger **drawer** sidebar (new `AppShell`),
  single-column grids, scrollable tables, stacked form rows on small screens. **Verified in headless
  Chrome**: at 390px no horizontal overflow + drawer slides in on tap; at 1280px sidebar fixed and
  grids multi-column.
- **P3 (done):** dashboard table retitled; Activité/Import note when lists are capped. Filter buttons
  kept explicit by choice. Full status in docs/05-UX-REVIEW.md.

### Fix: Produits was missing from the sidebar (import was unreachable)
- **What:** Added **Produits** to the sidebar nav. It wasn't there at all, so the page — and the
  "Importer une liste" button on it — could only be reached by typing the URL. Now: sidebar →
  Produits → Importer une liste (/produits/import).
- **Why:** The developer couldn't find the bulk import. Root cause was navigation, not the feature.

### Bulk product import (HIGH gap) — kills the "type 100 products by hand" wall
- **What:** New **/produits/import** — she pastes a list (one product per line; separated by `;`
  or a tab if copied from Excel; columns `Nom ; Prix d'achat ; Frais ; Prix de vente ; Stock ;
  Seuil ; Catégorie`, only the name required). Live **preview** with "nouveau / mise à jour"
  badges; **upsert by name** (an existing name is updated, not duplicated → re-import is safe).
  Pure shared parser `lib/import.ts` (no DB, used by both the client preview and the server action);
  `importerProduits()` in the produits repo runs in a transaction and writes **one** activity-log
  summary. Linked from the Produits page.
- **Why:** Her stated **#1 stress** is entering 100+ products by hand. StockFlow had CSV import; we
  didn't. This directly removes that wall.
- **Result:** `npm test` 35/35 (+7 import/parser tests); tsc/lint/build clean; live verified
  (import creates products, preview + link work, imported item appears in the catalog). See **D-015**.
- **Both HIGH gaps from the parity analysis are now done** (backup/export + bulk import).

### Backup / data export (HIGH gap) + seed fix
- **What:** New **Sauvegarde** page + `/sauvegarde/export` route (auth-checked). A **full
  consistent backup** of the whole database via SQLite `VACUUM INTO` (downloadable `.db` she can
  store off the laptop), plus **CSV exports** (produits, ventes, dépenses) for Excel. Added
  `lib/repo/export.ts`, `exporterBase()` in `lib/db.ts`, and a sidebar entry.
- **Fixed a bug I had introduced:** `npm run db:seed` was failing — `scripts/seed.ts` `clear()`
  didn't delete the new `activite` table, whose FK to `utilisateur` blocked `DELETE FROM
  utilisateur`. Added `activite` to the clear list. *(Lesson: adding a table means updating seed.)*
- **Why:** Her entire business lived in one file with no copy — the top data-loss risk from the
  parity analysis. A non-expert wouldn't ask for it; it's essential.
- **Result:** `npm test` 28/28 (+5 export tests, incl. that `exporterBase` writes a *restituable*
  SQLite file); tsc/lint/build clean; live verified — valid 118 KB `.db` download (correct SQLite
  magic bytes), CSV with real data, and an **unauthenticated** download is blocked (307, no leak).
  See **D-014**.
- **Next:** bulk product import (the other HIGH gap).

### Journal d'activité (audit log) — "qui a fait quoi, et quand"
- **What:** Added a full action log: new `activite` table (idempotent in migrate) + `lib/repo/
  activite.ts` (`journaliser`, `listActivite` with action/day filters), wired into **every
  data-changing repo** (ventes, achats, produits, depenses, controle, soldes create/modify/delete)
  and login. Logging happens **at the data layer, inside the same transaction** as the change, so
  it's tamper-consistent; it's **best-effort** (a log error never breaks the operation). New
  `/activite` page + sidebar item, filterable by action and day, showing when / who / action /
  what / details / amount. Threaded the session user id into the repo edit/delete signatures.
- **Why:** The developer rightly flagged that a theft/accountability-focused app must record who did
  what and when — the old software had it, we didn't. Core to the purpose, not optional.
- **Result:** `npm test` 23/23 (added `activite` tests; user_id is a real FK so a `creerUser`
  test helper was added); tsc/lint/build clean; live verified (a recorded sale shows in the log
  with the user's name). See **D-013**.
- **Next:** the two HIGH gaps from the parity analysis — backup/export, then bulk import.

### Parity & gap analysis vs the old software (StockFlow)
- **What:** Cloned and read the OLD app (StockFlow / `Store-management`) in full — 17-model Prisma
  schema, all pages/API routes, docs — and diffed it against Ma Boutique, applying expert judgment
  (not just what the owner asked). Wrote `docs/04-PARITE-STOCKFLOW.md`.
- **Why:** The owner asked, rightly, whether anything important was lost — she's not a software
  expert, so part of ownership is catching what she wouldn't think to ask for.
- **Findings:** Most "missing" features were **correctly cut bloat** (forced cash session, barcode
  entry, VAT, loyalty/promo, receipts, notification center). Two **HIGH** genuine gaps a pro should
  insist on: **(1) backup / data export** (whole business in one SQLite file, no backup — biggest
  miss), **(2) bulk product import** (her #1 stress is typing 100+ products by hand; StockFlow had
  CSV import). Plus MEDIUM: customer credit/debt ledger, per-product stock-movement history view
  (cheap, fits her theft-investigation), expiry tracking for perishables, best/worst-seller + week/
  half-day views, mobile-money commissions as income.
- **Next:** Build the two HIGH gaps (backup/export, then bulk import) after developer confirms
  priority; keep refusing the bloat.

### Phase D — Soldes du jour (daily money reconciliation)
- **What:** Built her #1 money check: `lib/repo/comptes.ts` + `app/(app)/soldes/` (new sidebar
  item "Soldes du jour"). For each account (Espèces, TMoney, Flooz, Crédit) she enters **attendu**
  (what should be there / her capital-float) and **compté** (what's really there); the app shows
  per-account and total écart with a clear verdict — **"Ça tombe juste ✓" / "Il manque X"** — plus
  a day picker and a history of recent days. One record per account per day (re-save replaces);
  attendu carries forward to days not yet counted. Added an idempotent migration
  (`solde_journalier.attendu` column) in `lib/db.ts`.
- **Why:** Straight from her words — cash + TMoney + Flooz vs the capital she put in; if it's
  short, "il y a une perte." Deliberately **balances-only, not per-transaction logging** (that
  overload is what she abandoned app #1 over). See D-001/D-012.
- **Deferred (documented, not dropped):** mobile-money **commissions as income** (she totals
  TMoney/Flooz commissions monthly) — a clean follow-up to fold into Bénéfices later.
- **Result:** `npm test` 19/19 (added 5 reconciliation tests); tsc/lint/build clean; live verified.
- **Next:** Phase E polish (worst-sellers, week/half-day breakdowns, credit-debt list) and the
  commissions-as-income follow-up.

### Phase C — Dépenses → marge réelle (real net profit)
- **What:** Built the expense ledger: `lib/repo/depenses.ts` (create/edit/delete, per-month
  total) + `app/(app)/depenses/` (month selector, form with her categories — loyer, salaires,
  transport, électricité, eau, internet, amortissement, impôts OTR/Mairie — a "revient chaque
  mois" flag, and an editable/deletable list with a monthly total). Wired the **net margin** into
  Bénéfices: a new "Ton gain réel ce mois-ci" block showing **marge sur marchandise − dépenses
  du mois = marge réelle**, linking to /depenses. Replaces the "Bientôt disponible" stub.
- **Why:** The brief's Bénéfices only showed *gross* margin; she explicitly wants the real number
  after rent/salaries/transport/taxes. (Roadmap Phase 3.)
- **Result:** `npm test` now 14/14 (added 4 dépense tests incl. the marge-réelle arithmetic);
  tsc/lint/build clean; live pages verified. See **D-011**.
- **Next:** Phase D — daily money reconciliation (cash + TMoney + Flooz). Needs the scope
  confirmation noted in D-001 first.

### Test suite added; Phases A–B committed
- **What:** Added a real `vitest` suite (`npm test`, 10 tests in `test/`) covering achat/vente
  editing (stock + audit rows) and Contrôle de stock (variance, CFA valuation, stock correction,
  history, the "compte juste" and empty-input cases) — runs against an in-memory SQLite db.
  Committed all of Phase A + B + these docs to `main` in 5 logical commits.
- **Why:** Verification needed to live *in the repo* and be repeatable by anyone, not just ad-hoc
  scripts. Per the no-AI-branding agreement, commits carry no AI co-author trailer.
- **Result:** `npm test` green; `tsc`/`lint`/`next build` clean. Local `data/` is gitignored
  (regenerated by `npm run db:seed`). Not yet pushed to the remote.

### Moved to VSCode + fresh repo; raw interview docs added as ground truth
- **What:** Development moved out of the Claude desktop app (which was giving the developer
  "a lot of issues") into VSCode, working directly in the code. The project now lives in a
  **new dedicated local repo `Gestion-de-stock`** (`~/Downloads/ma-boutique`), exported from
  the desktop session. The original **questionnaire** and the owner's **raw voice-transcribed
  answers** are now committed under `docs/` (`questionnaire boutique.pdf`,
  `ANSWER QUESTIONS BOUTIQUES.pdf`).
- **Why:** Stable IDE workflow + the raw answers are the real ground truth; `docs/00-PROJECT-BRIEF.md`
  is a distillation. Where the raw answers and the brief differ, trust the raw answers.
- **Result:** The old **repo write-access (403) blocker is moot** — fresh repo. See D-006/D-008.
- **Dev login:** `maman` / `maman2026`. Run: `npm install` → `npm run db:seed` → `npm run dev`.

### Verification verdict — what's actually built vs what she needs
- **What:** Read the live code against the raw requirements (not the docs). Confirmed working:
  sales record with **no forced caisse**, vocabulary is **ACHAT/VENTE** (no inventaire/ravitaillement),
  **barcode optional**, the per-product **Bénéfices** table + month selector, dashboard KPIs.
  Found gaps: (1) **editability half-wired** — achats/ventes were delete-only (the very thing
  that sank app #1); (2) **Contrôle de stock** and **Dépenses** were "Bientôt disponible" stubs;
  (3) **mobile-money reconciliation absent** (compte/solde tables seeded but unused).
- **Why:** Establish an honest baseline before building. The repo `docs/` over-stated completeness.
- **Result:** Build roadmap written to `~/.claude/plans/so-i-started-working-refactored-hennessy.md`
  (Phase A–E). Net: foundation + notebook replacement (old Phases 0–1) were ~done; her top
  priorities (theft control, real profit, money reconciliation) were not.

### Phase A — Full editability restored
- **What:** Wired the orphaned `updateAchat()` into an edit action + inline-edit row
  (`app/(app)/achats/AchatRow.tsx`); added `updateVente()` + `app/(app)/ventes/VenteRow.tsx`
  (fix quantities, set a line to 0 to remove it, change payment). Products were already editable.
- **Why:** Records she couldn't edit was a stated top reason she abandoned app #1; the achat form
  even promised "tu pourras toujours modifier après" — now true.
- **Result:** All record types (produit/achat/vente) editable; every edit writes a `correction`
  row to `mouvement_stock`. Verified by a repo-level test (9/9) + live 200s on all pages.

### Infra fixes — the app could not run or build in this environment (pre-existing)
- **What:** `lib/db.ts` loaded `node:sqlite` via `createRequire`, which crashes under this
  Next 16 Turbopack + Node 25 setup → every page 500'd in dev **and** `next build` failed.
  Switched to `process.getBuiltinModule("node:sqlite")`. Then `next build`'s 13 parallel
  page-data workers raced on the DB ("database is locked") because `db.ts` connected+migrated
  at *import*; made the connection **lazy** (opens on first query) + added `busy_timeout`.
- **Why:** Confirmed pre-existing (reproduced on a stashed/clean tree) and fully blocking. Owning
  the project means the app must actually run and deploy.
- **Result:** `next dev` serves all pages (200); `next build` clean 3/3. See **D-009**.

### Phase B — Contrôle de stock (anti-theft) built
- **What:** New `lib/repo/controle.ts` + `app/(app)/controle/` (count form, action, list, and
  `[id]` detail). She counts what's really on the shelf (any subset — supports spot-checks),
  sees live per-product **écart** and a CFA **"Manque (vol/perte ?)"** total; recording corrects
  the system stock to reality and keeps the écart in history (`mouvement_stock` type `controle`).
- **Why:** Her #1 priority and the tool for the baseline inventory she wants to run *with* her
  employee before that employee leaves (Dec 2026).
- **Result:** Replaces the stub. Verified by a repo test (6/6) + live page tests. See **D-010**.
- **Next:** Phase C — Dépenses → real net profit (recette − dépenses).

---

## 2026-06-25

### Documentation & planning structure
- **What:** Added `01-ROADMAP.md` (the phased plan) and this work log; established
  working agreements (document everything, her vocabulary is law, never a dead end,
  ship per phase, no AI branding).
- **Why:** Ensure the project follows a written plan and is fully documented end-to-end.
- **Result:** `boutique/docs/` now holds Brief + Roadmap + Worklog (+ Decisions to follow).
- **Next:** Resolve repo write access; confirm repo structure (same repo vs new repo).

### Design validation — APPROVED
- **What:** Built a static high-fidelity prototype of the 5 key screens in the real
  front-end stack (HTML + hand-written CSS design system), rendered to PNG:
  Tableau de bord, Achats, Ventes, Contrôle de stock, Bénéfices.
- **Why:** The previous app failed on UX + vocabulary, not features. We lock look and
  wording before writing logic to de-risk exactly that.
- **Decisions reflected:** her words (Achats/Ventes/Contrôle/Bénéfices, not
  inventaire/ravitaillement); no forced cash session; fully editable; name-first lookup;
  no barcode requirement; light mobile-money reconciliation on the dashboard; the
  per-product profit table she explicitly asked for.
- **Result:** Developer approved the design. Final wording check with the owner herself
  deferred to handover (Phase 6).
- **Files:** `boutique/prototype/*.html`, `styles.css`, `shots/*.png`.

### Tooling chosen over Canva
- **What:** Recommended against Canva for app screens; built the prototype in the real
  front-end stack instead.
- **Why:** Canva is template/marketing-oriented and throwaway; a real-stack prototype is
  faithful and becomes the actual product (zero wasted work). Canva reserved for an
  optional future logo/brand mark only.

### Foundational brief
- **What:** Wrote `00-PROJECT-BRIEF.md` — persona, root-cause analysis of why the previous
  app (StockFlow) was abandoned, the owner's explicit requirements from the interview,
  scope decisions, the data model in her French vocabulary, and the 6-phase roadmap.
- **Why:** Single source of truth for a "100% personalized" build.
- **Inputs analyzed:** the 35-question questionnaire + the full ~76k-char raw interview
  transcription, read in full; plus the existing StockFlow codebase (Prisma schema, API
  routes, README).

### Scope decisions made (delegated by the developer — see 03-DECISIONS.md)
- Mobile money: **light** (account-balance reconciliation, not per-transaction logging).
- Anti-theft: **owner records now**; the weapon is the fast Contrôle de stock; a
  **sell-only employee role** is built but switched off until trusted.
- Build: **truly from zero** (fresh app/stack, nothing copied from StockFlow).
- Platform: **hosted web app (PWA)**, French, reachable from laptop + phone.

---

## Open blockers

| Blocker | Detail | Owner | Status |
|---|---|---|---|
| Repo write access | Previously `git push`/GitHub API returned **403**. | Resolved by moving to the new dedicated repo `Gestion-de-stock`. | **RESOLVED (2026-06-27)** |

## Open questions for the developer

1. **Mobile-money scope (Phase D):** the raw answers show mobile money is ~half her day and
   richer than the brief's "light reconciliation" (cash + TMoney + Flooz balances vs deposited
   capital → perte; commissions on selling/buying crédit; network-delayed SMS balances). Confirm
   the exact daily ritual to model before building Phase D. (See D-001.)
2. Reactions to design wording/personalization (shop name, owner name on dashboard).
3. **Push to remote:** Phases A+B + docs are committed to local `main` (5 commits) but **not
   pushed** to `github.com/rapetoh/Gestion-de-stock` yet — confirm when to push.
