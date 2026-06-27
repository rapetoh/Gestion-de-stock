// Shared test helpers. The DB is in-memory (set in vitest.config.ts), fresh per test file;
// resetDb() clears it between tests so each case starts from a known empty state.
import { db, all, one } from "../lib/db";

const TABLES = [
  "ligne_vente",
  "vente",
  "achat",
  "mouvement_stock",
  "ligne_controle",
  "controle_stock",
  "solde_journalier",
  "depense",
  "compte",
  "produit",
  "utilisateur",
];

export function resetDb(): void {
  for (const t of TABLES) {
    db.exec(`DELETE FROM ${t};`);
    db.exec(`DELETE FROM sqlite_sequence WHERE name='${t}';`);
  }
}

export function stockOf(produitId: number): number {
  return one<{ stock: number }>("SELECT stock FROM produit WHERE id = ?", produitId)!
    .stock;
}

export function lastMvt(
  produitId: number
): { type: string; quantite: number; raison: string } | undefined {
  return all<{ type: string; quantite: number; raison: string }>(
    "SELECT type, quantite, raison FROM mouvement_stock WHERE produit_id = ? ORDER BY id DESC LIMIT 1",
    produitId
  )[0];
}

export function countMvts(produitId: number): number {
  return all("SELECT id FROM mouvement_stock WHERE produit_id = ?", produitId).length;
}
