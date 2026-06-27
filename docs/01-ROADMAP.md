# Ma Boutique — Roadmap & Plan

> The plan we follow. Each phase has a goal, a checklist, and a "done when" bar.
> Progress is checked off here; narrative of what happened lives in `02-WORKLOG.md`;
> decisions and their reasoning live in `03-DECISIONS.md`.
>
> Legend: `[ ]` not started · `[~]` in progress · `[x]` done.
> Last updated: 2026-06-27.

---

## Where we are right now

- **Design pre-step:** ✅ done — 5 key screens approved (look + vocabulary).
- **Phase 0 (Foundation):** ✅ done — Next.js + TS + Tailwind app, `node:sqlite` data layer
  (see D-007/D-009), owner auth, French sidebar, all routes live.
- **Phase 1 (Notebook replacement):** ✅ done — Produits/Achats/Ventes/Stock/Bénéfices all work;
  **editability completed 2026-06-27** (achats + ventes were delete-only; now fully editable).
- **Phase 2 (Anti-theft / Contrôle de stock):** ✅ done — 2026-06-27 (count → écart in CFA →
  corrects stock + history; list + detail).
- **Phase 3 (Dépenses → marge réelle):** ✅ done — 2026-06-27 (expense ledger + net margin in
  Bénéfices).
- **Phase 4 (Daily reconciliation / Soldes):** ✅ done — 2026-06-27 (attendu vs compté per account
  → "ça tombe juste / il manque X" + history; commissions-as-income deferred — D-012).
- **Phase 5 (employee role) / Phase 6 (polish & handover):** not started. Plus a small backlog:
  mobile-money commissions as income, worst-sellers, week/half-day sales breakdowns, credit-debt list.
- **Now building in:** VSCode, repo `Gestion-de-stock`. Detailed build roadmap +
  verification verdict: `~/.claude/plans/so-i-started-working-refactored-hennessy.md`.
- **Blocker:** none open (the old 403 push blocker is resolved — fresh repo).

---

## Phase D — Design validation  `[x]` (approved)

**Goal:** lock the look and the French vocabulary before writing any logic, because
vocabulary + UX is what sank the previous app.

- [x] Static high-fidelity prototype of the 5 key screens, real front-end stack
- [x] French wording in the owner's own words
- [x] Owner-side approval of look & feel  *(approved 2026-06-25)*
- [ ] Final wording check **with the boutique owner herself** (deferred to handover)

**Done when:** the developer approves the design. ✅

---

## Phase 0 — Foundation  `[x]`

**Goal:** a deployable empty app shell with auth and the data model — no features yet.

- [x] Initialize the from-zero app (Next.js + TypeScript + Tailwind)
- [x] Database + thin data layer (**`node:sqlite`**, not Prisma/Postgres — see D-007/D-009),
      connection + migrations (`lib/db.ts`)
- [x] Data model: Produit, Achat, Vente, MouvementStock, Compte, Dépense, ContrôleStock, Utilisateur
- [x] Owner authentication (single user; JWT cookie via jose)
- [x] French UI shell: sidebar nav with her vocabulary, layout, the design system from the prototype
- [ ] Deploy pipeline (hosting + env) so it's reachable from laptop and phone  *(still to do)*
- [~] CI: lint + typecheck pass locally; no CI pipeline wired yet

**Done when:** the app deploys, the owner can log in, every nav item routes to an (empty) page.
*(Runs locally; remote deploy pipeline still pending.)*

---

## Phase 1 — The notebook replacement  `[x]`  ← was highest priority

**Goal:** replace her 100-page cahier. This alone should make the app worth using.

- [x] **Produits**: create / edit / search by name; barcode optional; categories optional
- [x] **Achats**: nom → quantité → prix d'achat → + frais → marge → prix de vente (auto), stock ++
- [x] **Ventes**: pick by name, quantity, payment method, encaisser — **no cash session**, stock −−
- [x] **Stock** live view; low-stock flags
- [x] **Everything editable** with an audit trail (never block a correction)  *(completed 2026-06-27)*
- [x] **Bénéfices** table: one line per product (acheté | frais | vendu | marge) + totals
- [~] Fast first-catalog entry flow (works; not yet specially optimized — revisit in Phase 6)

**Done when:** she can record an achat and a vente unaided on the first try, and read the
profit table without a calculator.

---

## Phase 2 — Anti-theft (Contrôle de stock)  `[x]`  *(done 2026-06-27)*

**Goal:** detection she can run in minutes, even remotely.

- [x] Contrôle de stock: théorique vs compté → écart per product (any subset / spot-check)
- [x] Flag shortfalls + estimated money value (CFA, at coût de revient)
- [x] History of controls; per-control detail view (`/controle/[id]`)
- [ ] Per-product variance trend over time *(history exists per control; cross-control trend later)*

**Done when:** she runs a control and immediately sees which products are short and by how much. ✅

---

## Phase 3 — Money truth (Dépenses + marge réelle)  `[x]`  *(done 2026-06-27)*

- [x] Dépenses ledger: recurring flag + one-off (loyer, salaires, électricité, eau, transport,
      internet, amortissement, OTR/mairie); fully editable; per-month view
- [x] Monthly: marge sur marchandise − dépenses = **marge réelle** (shown in Bénéfices)
- [ ] Yearly view / capital view *(monthly done; annual roll-up later)*

**Done when:** she sees real monthly margin without manual subtraction. ✅ (monthly)

---

## Phase 4 — Daily reconciliation (Soldes)  `[x]`  *(done 2026-06-27)*

- [x] Comptes: Espèces, TMoney, Flooz, Crédit (seeded; active ones shown)
- [x] Daily balance entry (attendu vs compté) → "ça tombe juste ?" with the écart highlighted
- [x] History of recent days; per-account écart
- [ ] Light mobile-money commissions as income *(deferred — D-012; small backlog item)*

**Done when:** at end of day she enters balances and the app confirms it balances or shows the gap. ✅

---

## Phase 5 — Prevention-ready (employee role)  `[ ]`

- [ ] Sell-only employee role (own login): can record ventes; cannot see margins, edit, or delete
- [ ] Owner switch to enable/disable employee access
- [ ] Full audit trail per user

**Done when:** the owner can safely hand the sell screen to an employee when she chooses to.

---

## Phase 6 — Polish & handover  `[ ]`

- [ ] French copy review **with the owner** on real screens
- [ ] Onboarding / guided first catalog entry
- [ ] Training + short written guide (in French)
- [ ] Backup/export of her data

**Done when:** she uses it daily, unaided, and trusts it.

---

## Working agreements (how we run this project)

1. **Document everything.** Every work session is logged in `02-WORKLOG.md`; every
   non-obvious decision in `03-DECISIONS.md`.
2. **Her vocabulary is law.** No screen ships with a word she wouldn't use.
3. **Never a dead end.** No forced session, no blocked edit, no required barcode.
4. **Ship per phase.** Each phase is independently useful and reviewed before the next.
5. **No AI branding** in the repo, commits, or product — it reads as the developer's own work.
6. **Full ownership.** The developer asked for 100% ownership/accountability: drive the
   roadmap, verify your own work by actually running it (not just asserting), surface problems
   plainly (including honest pushback), and keep these docs current as you go so anyone joining
   the project knows exactly what's done and where we are.
