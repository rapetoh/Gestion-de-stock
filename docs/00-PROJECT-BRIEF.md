# Ma Boutique — Project Brief (Source of Truth)

> Working title: **Ma Boutique**. A new, from-zero application replacing the abandoned
> "StockFlow" app. This document is the single source of truth for *why* we are building
> what we are building. Every feature decision must trace back to something in here.
>
> Status: **Draft v1** — direction agreed, build not yet started.
> Owner / lead engineer: this project's engineer (full ownership).
> Last updated: 2026-06-25.

---

## 1. Who we are building for (the persona)

A small boutique owner in a CFA-franc / OTR / mairie context (Togo). Based on a long recorded
interview (transcribed raw), the real picture:

- **Older, non-technical, often tired.** Runs her home *and* the shop *and* does her own
  sourcing at the market. Refers to the developer as "mon fils."
- **Frequently absent.** Arrives late morning to early afternoon (11h–13h). One trusted
  employee of ~5 years runs the shop alone for hours. That employee has announced she is
  **leaving in December**; a new, not-yet-trusted hire is expected.
- **Her business is two businesses braided together:**
  1. **Retail** — cosmetics, general groceries, cartons/packs of mineral water, sachet
     water, canned drinks, liquor, imported bedsheets (draps). **100+ distinct products.**
  2. **Mobile money** — selling airtime ("crédit"), and TMoney / Flooz deposits &
     withdrawals. Managing virtual-money float across **two phones**, chasing the agents who
     refill/empty them, and tracking commissions. This is roughly **half her day**.
- **Her deepest need, emotionally:** *"Does my money add up at the end of the day, and if
  not, where is the leak?"* She suspects theft/loss but today **cannot prove or locate it.**

This persona — not a generic "store manager" — drives every decision below. The app must be
**boring, obvious, forgiving, and fast.** The opposite of clever.

---

## 2. Why the first app (StockFlow) failed

Her complaints were vague on the surface, precise underneath. It failed for **three concrete
reasons**, none of them "missing features":

1. **Vocabulary mismatch.** "Inventaire" and "ravitaillement" mean nothing to her — to her,
   *inventaire* = physically counting stock, full stop. Her words are **ACHAT** and **VENTE**.
   The old menu forced her *into "Inventaire"* to record a purchase. Alien from the first click.
2. **A mandatory "ouverture de caisse" (cash session) blocked her completely.** To record a
   sale, the old app demands opening a cash session she could never figure out. Result: she
   **could not record a single sale.** This is the wall that ended adoption.
3. **Immutable records.** Once entered, the old app refuses edits ("le système me refuse de
   modifier"). She experiences the app as *fighting* her.

Aggravating factors: over-designed UI (orb navigation, glassmorphism, floating cards) for a
tired non-technical user; bloat she never asked for (promo codes, loyalty cards, tax rates,
expiration alerts); and a **barcode-first** flow when she has **no barcodes** on most products
and gave up inventing them.

**The only thing she can do in the old app is create a product.** Everything else defeated her.

### Hard constraints derived from these failures (non-negotiable)

- **Her vocabulary, in French.** ACHAT, VENTE, STOCK, DÉPENSES, BÉNÉFICE, CONTRÔLE DE STOCK.
  Never "inventaire/ravitaillement" for the act of buying.
- **No forced cash session.** Selling must be possible in one or two taps, always.
- **Everything is editable.** She can correct any record, any time. Corrections are logged
  (audit trail) but never blocked.
- **No barcode requirement.** Barcode is optional; the primary lookup is by **product name**.
- **No feature she didn't ask for.** Every screen must earn its place against §4.

---

## 3. What she explicitly asked for (she handed us the spec)

Her own top 3, in her order:

1. **Stock: entries (achats), exits (ventes), and what's left** — so she sees the truth.
2. **Control / contrôle de stock to catch theft** — a fast count comparing *what the system
   says should be on the shelf* vs *what is actually there*, checkable even remotely.
3. **Real profit margin** — and identifying which products sell vs which don't.

She described the exact data-entry flow she wants, repeatedly:

> name → quantity → purchase price → **+ transport** → **+ her margin** → **sale price**

And she asked almost verbatim: *"Can all this be in a table?"* — **one line per product** showing
**bought-for | transport | sold-for | margin**, with **totals at the bottom = monthly profit.**
The old app had this table and she liked it. **We bring it back as a centerpiece.**

She also wants an **expenses ledger** (rent, salaries, electricity, water, transport, furniture
depreciation, OTR, mairie) so that **recette − dépenses = real monthly/annual margin** and she
can see her capital.

Her own words for the "3 changes after a year": **(1)** stock in / stock out / stock remaining,
**(2)** control/inventaire to prevent theft + identify winners vs losers, **(3)** determine
profit margin.

Her stressful point: the **initial product data entry** (building the catalog). Once the base
exists, "le reste n'est plus stressant." → We must make first-time catalog entry as painless
as possible (fast add, bulk add, optional fields).

Time budget: she's fine spending **~2 hours** on the computer with breaks — she is *not* a
"5 minutes max" user. She'll invest time **if it's simplified.**

---

## 4. Scope decisions (made by the lead engineer, with reasoning)

These were delegated to the engineer with the instruction: decide what *should* be done.

### IN — Phase scope

| Decision | Call | Why |
|---|---|---|
| **Mobile money** | **Light** — model money as a few **Comptes** (Espèces, TMoney, Flooz, Crédit/airtime); she enters balances, system reconciles. No per-transaction logging. | Her #1 need (does the money add up) is meaningless without the phone floats, but full transaction logging is the overload that killed app #1. Light = right altitude. |
| **Anti-theft / who records** | **Owner records now.** The weapon is the **fast Contrôle de stock** (expected vs counted → per-product variance). A **sell-only employee role** is built but **switched off** until she trusts the next hire. | No app catches a sale nobody typed. Detection (stock count) works day one; prevention (employee records at counter) is ready when she is. The sell-only role is *safer* than today (no margins, no edits, no deletes). |
| **Build approach** | **Truly from zero.** New app, fresh stack, nothing copied from StockFlow. Old app stays as a documented record of failure. | Explicit instruction. Also the cleanest way to escape the old app's baked-in wrong assumptions. |
| **Platform** | **Hosted web app (PWA)** on the shop laptop, reachable from her phone. Next.js + TS + Tailwind, Prisma + hosted PostgreSQL. | Good internet; she wants to check remotely when away → must be multi-device, not a local file. |
| **Language** | **French only**, her vocabulary. Engineering docs in English. | She is francophone and non-technical. |

### OUT (for now) — explicitly not building

Promo codes, loyalty cards, configurable tax rates, expiration-date alert engine,
barcode-mandatory flows, fancy/animated UI, multi-store. None were asked for; all add load.
(Expiration tracking *may* return later as a simple per-batch date field if she asks.)

---

## 5. The model, in her words (French UI terms → engineering concepts)

| French UI term (hers) | Concept | Notes |
|---|---|---|
| **Produit** | Product | nom, catégorie (optional), quantité en stock, prix d'achat, frais (transport), prix de vente, **marge (auto)**. Barcode optional. |
| **Achat** (entrée de stock) | Purchase / restock | Increments stock. Records purchase price + transport, sets/updates sale price. Computes margin. **This replaces "ravitaillement/inventaire."** Only the owner does this. |
| **Vente** (sortie de stock) | Sale | Decrements stock, records money in + payment method (espèces / TMoney / Flooz / crédit). One or two taps. **No cash session required.** |
| **Contrôle de stock** | Stock count / variance | She counts; system shows *il devrait rester X, compté Y → écart Z* per product. **The anti-theft tool.** |
| **Dépenses** | Expense ledger | Rent, salaries, electricity, water, transport, depreciation, OTR, mairie. Recurring + one-off. |
| **Comptes / Soldes** | Money accounts | Espèces (caisse), TMoney, Flooz, Crédit. Daily balance entry → reconciliation ("ça tombe juste ?"). |
| **Bénéfice / Rapport mensuel** | Profit report | **The table she loves**: one line per product (acheté \| frais \| vendu \| marge) + totals. Then recette − dépenses = real margin. |
| **Tableau de bord** | Dashboard | At-a-glance: ventes du jour, top/worst products, stock bas, reconciliation status, marge du mois. |

**Cross-cutting rules:** everything editable (with audit log); French; name-first lookup;
no forced sessions; works on laptop and phone.

---

## 6. Build roadmap (phased so she gets value early)

- **Phase 0 — Foundation.** Scaffold the from-zero app, owner authentication, data model,
  French UI shell, deploy pipeline. *(No user-visible features yet.)*
- **Phase 1 — The notebook replacement (the part she'll love first).** Produits, Achats,
  Ventes, live Stock view, fully editable, and the **profit table**. This alone replaces her
  100-page cahier. **Highest priority.**
- **Phase 2 — Anti-theft.** Contrôle de stock + per-product variance report ("écart").
- **Phase 3 — Money truth.** Dépenses ledger + monthly **recette − dépenses = marge réelle.**
- **Phase 4 — Reconciliation.** Comptes/Soldes daily balance + "ça tombe juste ?" (cash +
  mobile money light).
- **Phase 5 — Prevention-ready.** Employee **sell-only** role; owner switches it on when ready.
- **Phase 6 — Polish & handover.** French copy review *with her*, onboarding for first catalog
  entry, training. (Possibly a guided "import your products" flow to ease the stressful start.)

Each phase ships independently and is documented as it lands.

---

## 7. Open items to verify *with her later* (not blocking the build)

These do not block starting; we confirm during Phase 1/6 review, not by another questionnaire:

1. Confirm the exact set of **Comptes** (Espèces, TMoney, Flooz, Crédit — any others?).
2. Confirm she's happy with **ACHAT / VENTE / STOCK / DÉPENSES / CONTRÔLE / BÉNÉFICE** as the
   menu words (a 2-minute check on a real screen beats a survey).
3. Confirm the **product categories** she wants (groceries / cosmetics / water / draps / …).
4. The recurring **expense list & amounts** (rent, salary, OTR, mairie, etc.) for Phase 3.

---

## 8. Definition of "100% personalized" (our bar)

We will consider this delivered only when:

- She can record an **achat** and a **vente** unaided, on the first try, without help.
- She can run a **contrôle de stock** and immediately see the **écart** per product.
- She can open the **rapport mensuel** and read her **real margin** without a calculator.
- She never hits a wall that says "no" (no forced session, no blocked edit, no required barcode).
- Every word on screen is a word **she** uses.
