# Ma Boutique vs. StockFlow — Feature Parity & Gap Analysis

> Done 2026-06-27. The old software (StockFlow, repo `Store-management`) was read in full —
> its Prisma schema (17 models), all pages, all API routes, and docs — and compared against
> Ma Boutique. Goal: make sure nothing **important** for this business was lost, judged not only
> by what the owner asked for (she is not a software expert) but by what a retail + mobile-money
> shop genuinely needs.

## Framing — why "fewer features" is mostly correct here

StockFlow was a full enterprise-ish POS. It was abandoned **because** of that weight: forced cash
session, immutable records, barcode-first entry, and vocabulary she didn't use. So most of what
Ma Boutique "lacks" was cut **on purpose** and should stay cut. The analysis below separates the
**deliberate, correct cuts** from the **genuine gaps**.

## Correctly cut as bloat (do NOT re-add)

| StockFlow feature | Why it's right to leave out |
|---|---|
| Forced **cash session** (open/close register) | The single thing that blocked her from recording a sale. Replaced gently by **Soldes du jour**. |
| **Barcode** scanning (entry depended on it) | She has no barcodes; she invented then abandoned them. Barcode is optional in the new app. |
| **VAT / tax rates** per sale | Informal Togo boutique; no VAT invoices. Her real taxes (OTR, mairie) are periodic — handled in **Dépenses**. |
| **Loyalty cards, promo codes** | Anonymous walk-in customers; discounts only ad-hoc. Pure overhead for her. |
| **Receipts / printing, company SIRET/VAT, branding** | She doesn't issue receipts. |
| **Notification center**, multi-tab analytics, expiration-alert engine UI | Dashboard low-stock + simple KPIs cover her at the right altitude. |
| Full **Customer** database, **Returns** module, **Category** management UI | Nice-to-have; not her workflow. Low priority at most. |

## Genuine gaps (important, ranked) — what she wouldn't know to ask for

### HIGH — a professional should insist on these
1. **Backup / data export.** Her entire business lives in one SQLite file. **No backup, no export.**
   Lost/corrupted laptop = everything gone. StockFlow could export CSV; Ma Boutique can't. This is
   the most important miss — invisible to a non-expert, critical for a real business.
2. **Bulk product import** (CSV / paste). Her stated #1 stress is entering 100+ products by hand.
   StockFlow had CSV import; Ma Boutique forces one-at-a-time typing. Directly attacks her worst
   pain (the "first catalog entry" wall).

### MEDIUM — asked-for or clearly useful
3. **Customer credit/debt ("qui me doit")** — `credit` is a payment type but there's no who-owes/
   how-much ledger. She asked for this (questionnaire Q29). *(already in backlog)*
4. **Per-product stock-movement history view.** The data exists (`mouvement_stock`) but no screen
   shows it. This is exactly her theft-investigation method (trace a product from purchase to
   sold-out). Cheap to add; high fit.
5. **Expiry tracking for perishables.** She sells food/water/canned milk; StockFlow tracked
   expiration per batch. Expired stock = silent loss. She didn't ask; a food retailer benefits.
6. **Best/worst-seller report + week / half-day sales views.** She asked to see what sells most/
   least and "combien vendu en une demi-journée / journée / semaine" (Q29). *(already in backlog)*
7. **Mobile-money commissions as income** — fold into Bénéfices. *(deferred — D-012)*

### Units-of-measure (open question, not a StockFlow regression)
She buys by **carton** but sells by **unit** ("6 in a paquet"). Neither app truly models
carton→unit conversion; she works around it by naming products per selling unit. Worth a decision
on whether to support pack/unit conversion, or keep the manual workaround.

## Recommendation
Build the two **HIGH** gaps next (backup/export, then bulk import) — they're the real risk and the
real pain, and a non-expert owner wouldn't flag either. Then work the MEDIUM list (movement-history
view and credit-debt are the highest-value/lowest-cost). Keep saying no to the bloat above.
