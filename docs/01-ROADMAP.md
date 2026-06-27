# Ma Boutique — Roadmap & Plan

> The plan we follow. Each phase has a goal, a checklist, and a "done when" bar.
> Progress is checked off here; narrative of what happened lives in `02-WORKLOG.md`;
> decisions and their reasoning live in `03-DECISIONS.md`.
>
> Legend: `[ ]` not started · `[~]` in progress · `[x]` done.
> Last updated: 2026-06-25.

---

## Where we are right now

- **Phase 0 (Foundation):** not started.
- **Design pre-step:** ✅ done — 5 key screens approved (look + vocabulary).
- **Blocker:** repo write access (push returns 403). Tracked in `02-WORKLOG.md`.

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

## Phase 0 — Foundation  `[ ]`

**Goal:** a deployable empty app shell with auth and the data model — no features yet.

- [ ] Initialize the from-zero app (Next.js + TypeScript + Tailwind)
- [ ] Database + ORM (PostgreSQL + Prisma), connection + migrations
- [ ] Data model: Produit, Achat, Vente, MouvementStock, Compte, Dépense, ContrôleStock, Utilisateur
- [ ] Owner authentication (single user to start)
- [ ] French UI shell: sidebar nav with her vocabulary, layout, the design system from the prototype
- [ ] Deploy pipeline (hosting + env) so it's reachable from laptop and phone
- [ ] CI: lint + typecheck

**Done when:** the app deploys, the owner can log in, every nav item routes to an (empty) page.

---

## Phase 1 — The notebook replacement  `[ ]`  ← highest priority

**Goal:** replace her 100-page cahier. This alone should make the app worth using.

- [ ] **Produits**: create / edit / search by name; barcode optional; categories optional
- [ ] **Achats**: nom → quantité → prix d'achat → + frais → marge → prix de vente (auto), stock ++
- [ ] **Ventes**: pick by name, quantity, payment method, encaisser — **no cash session**, stock −−
- [ ] **Stock** live view; low-stock flags
- [ ] **Everything editable** with an audit trail (never block a correction)
- [ ] **Bénéfices** table: one line per product (acheté | frais | vendu | marge) + totals
- [ ] Fast first-catalog entry flow (her stated stress point)

**Done when:** she can record an achat and a vente unaided on the first try, and read the
profit table without a calculator.

---

## Phase 2 — Anti-theft (Contrôle de stock)  `[ ]`

**Goal:** detection she can run in minutes, even remotely.

- [ ] Contrôle de stock: théorique vs compté → écart per product
- [ ] Flag shortfalls + estimated money value
- [ ] History of controls; per-product variance over time

**Done when:** she runs a control and immediately sees which products are short and by how much.

---

## Phase 3 — Money truth (Dépenses + marge réelle)  `[ ]`

- [ ] Dépenses ledger: recurring + one-off (loyer, salaires, électricité, eau, transport,
      amortissement, OTR, mairie)
- [ ] Monthly: recette − dépenses = marge réelle; yearly view; capital view

**Done when:** she sees real monthly/annual margin without manual subtraction.

---

## Phase 4 — Daily reconciliation (Comptes / Soldes)  `[ ]`

- [ ] Comptes: Espèces, TMoney, Flooz, Crédit (configurable)
- [ ] Daily balance entry → "ça tombe juste ?" with the écart highlighted
- [ ] Light mobile-money commissions as income

**Done when:** at end of day she enters balances and the app confirms it balances or shows the gap.

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
