# Ma Boutique — Full UX Review

> Done 2026-06-27. Every screen and shared pattern reviewed as a senior UX designer would, for a
> non-technical, tired owner who uses a **laptop and a phone**. Goal: zero friction, weirdness, or
> anomalies. Each finding: what's wrong · why it matters · the fix · severity (P1 worst).
> Prompted by the developer noticing inline "Modifier" rows stack and never close.

## Cross-cutting (these repeat across many screens — fix once, everywhere)

### P1 — Destructive actions delete instantly, with no confirmation
Every **Supprimer** (produit, achat, vente, dépense) deletes on a single click — no "are you sure?",
no undo. On a phone, one mis-tap loses a record (and reverses stock/money). **Fix:** a confirmation
on every delete ("Supprimer cette vente ? Cette action est définitive."). Also make the button look
dangerous (red), not identical to "Modifier".

### P1 — No feedback after any action; forms and cart don't reset
Nothing confirms success. Worse, client state lies after submit:
- **Ventes:** after *Encaisser*, the cart stays full → looks unsold, easy to encaisser twice.
- **Achats / Dépenses / Produits "Nouveau":** fields keep their values → looks unsaved, easy to
  submit twice.
- **Contrôle / Soldes:** inputs keep their values after recording.
**Fix:** on success, clear the cart/form and show a short confirmation ("Vente enregistrée ✓").

### P1 — Inline edit rows stack, stay open, and never close on save (the reported bug)
Each row owns its own open/closed state, so several "Modifier" editors can be open at once, and
clicking **Enregistrer** leaves the editor open (no sign it saved). Affects Produits, Achats,
Ventes, Dépenses. **Fix:** at most one editor open at a time (opening one closes the others), and the
editor **closes automatically on save**. (Cancel already closes.)

### P1 — Destructive vs. safe buttons are visually identical
"Modifier" and "Supprimer" are both grey ghost buttons. **Fix:** add a `.btn.danger` (red) for
deletes so the eye distinguishes them instantly.

### P2 — No mobile / responsive layout (she uses a phone)
There are **no media queries**. The 248px sidebar is always shown, the two-column grids use fixed
pixel widths, and tables are wide — so on a phone the layout overflows and is hard to use. **Fix:**
collapse the sidebar into a top bar + menu button on small screens; stack the two-column grids; let
wide tables scroll inside their card. This is the biggest single piece of work.

### P3 — Filters require a manual "Afficher/Filtrer" click
Bénéfices, Dépenses, Activité, Soldes: changing the month/day/action doesn't apply until you click a
button. Defensible for a non-technical user (explicit), but auto-applying on change is smoother.
**Verdict:** keep explicit for now (lower priority); revisit if it annoys her.

### P3 — No double-submit protection / pending state
Submit buttons (except Import) don't disable while the action runs. With slow phone networks, double
taps = double records. **Fix:** disable the button while pending (pairs with the feedback fix).

## Per-screen notes

- **Tableau de bord:** Solid. Minor: "Ce qui se vend le plus" appears twice (a KPI tile *and* a full
  table with the same title). Keep both but retitle the table (e.g. "Classement des ventes du mois").
  Worst-sellers (which she asked for) still missing — backlog.
- **Produits:** P1 inline-edit + delete-confirm apply. "Nouveau produit" form doesn't reset (P1).
- **Achats:** AchatForm doesn't reset after enregistrer (P1). Row edit/delete (P1).
- **Ventes:** Cart doesn't clear (P1). Row edit/delete (P1). Otherwise the no-cash-session flow is good.
- **Stock:** Read-only, clean. Fine. (Low-stock rows are highlighted — good.)
- **Contrôle de stock:** Counts don't clear after recording + no success message (P1). Big list is
  fine (has search). Good "manque" framing.
- **Soldes du jour:** Inputs don't reset + no success message (P1). Verdict UI is good.
- **Dépenses:** Form reset (P1), row edit/delete (P1).
- **Bénéfices:** Display only; good. Filter click (P3).
- **Activité:** Filter click (P3). Long log is capped at 200 with no "showing latest 200" note —
  add the note (silent truncation reads as "that's everything").
- **Import produits:** After success, textarea + preview stay; add a "Vider" (clear) and note that
  the preview shows the first 200 lines while all are imported.
- **Sauvegarde:** Clear and good. Optional: remember/show "dernière sauvegarde" date later.

## Execution order
1. **P1 cross-cutting** (the bulk of the friction): danger button + delete confirm; single-open +
   close-on-save inline edit; success feedback + reset cart/forms; disable-while-pending.
2. **P2 mobile/responsive.**
3. **P3 + per-screen polish.**

Verification per batch: `npm run build`, live click-through on the affected screens (desktop + a
narrow viewport), and tests for any logic touched.
