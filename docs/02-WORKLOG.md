# Ma Boutique — Work Log

> Chronological record of everything done on this project, newest first.
> This is the "documenting everything" trail. Each entry: what, why, result, next.

---

## 2026-06-27

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
3. When to commit: A+B are in the working tree, uncommitted, pending review.
