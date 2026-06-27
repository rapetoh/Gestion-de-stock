# Ma Boutique — Work Log

> Chronological record of everything done on this project, newest first.
> This is the "documenting everything" trail. Each entry: what, why, result, next.

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
| Repo write access | `git push` and GitHub API both return **403** ("Resource not accessible by integration"). Work is committed locally but cannot reach the remote. | Developer to grant the Claude GitHub app **write/contents** on the target repo, or confirm a destination repo. | **OPEN** |

## Open questions for the developer

1. **Repo structure:** keep building inside the existing `rapetoh/Store-management`
   (in `boutique/`), or create a **new dedicated repo** for Ma Boutique? (See 03-DECISIONS.md.)
2. Reactions to design wording/personalization (shop name, owner name on dashboard).
