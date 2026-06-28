// Repository commissions — le revenu Mobile Money (TMoney, Flooz, crédit, airtime).
// La moitié de l'activité de la boutique. Comptabilisé à part de la marge marchandise puis
// AJOUTÉ à la marge réelle du mois (la marchandise et le mobile money sont deux gains distincts).
// Volontairement simple : une ligne par saisie, comme dans son grand cahier — pas de journal SMS.
import { all, one, run, nowIso } from "../db";
import { journaliser } from "./activite";
import { bornesMois } from "../periodes";

export type Commission = {
  id: number;
  libelle: string;
  montant: number;
  canal: string | null; // 'tmoney' | 'flooz' | 'credit' | 'autre'
  date: string;
  user_id: number | null;
};

export type CreateCommissionInput = {
  libelle: string;
  montant: number;
  canal?: string | null;
  date?: string | null; // "YYYY-MM-DD" ; sinon maintenant
  userId?: number | null;
};

function isoDepuisJour(jour?: string | null): string {
  if (jour && /^\d{4}-\d{2}-\d{2}$/.test(jour)) return `${jour}T12:00:00.000Z`;
  return nowIso();
}

export function createCommission(input: CreateCommissionInput): number {
  const libelle = input.libelle.trim();
  if (!libelle) throw new Error("Libellé manquant.");
  const id = run(
    `INSERT INTO commission (libelle, montant, canal, date, user_id) VALUES (?,?,?,?,?)`,
    libelle,
    Math.round(input.montant),
    input.canal ?? null,
    isoDepuisJour(input.date),
    input.userId ?? null
  ).lastId;
  journaliser({
    userId: input.userId,
    action: "creation",
    entite: "commission",
    details: `Commission : ${libelle}`,
    montant: Math.round(input.montant),
    refId: id,
  });
  return id;
}

export function updateCommission(
  id: number,
  data: { libelle?: string; montant?: number; canal?: string | null; date?: string | null },
  userId?: number | null
): void {
  const before = one<Commission>(`SELECT * FROM commission WHERE id = ?`, id);
  if (!before) throw new Error("Commission introuvable.");
  const montant = data.montant != null ? Math.round(data.montant) : before.montant;
  run(
    `UPDATE commission SET libelle = ?, montant = ?, canal = ?, date = ? WHERE id = ?`,
    (data.libelle ?? before.libelle).trim() || before.libelle,
    montant,
    data.canal !== undefined ? data.canal : before.canal,
    data.date ? isoDepuisJour(data.date) : before.date,
    id
  );
  journaliser({
    userId,
    action: "modification",
    entite: "commission",
    details: `Commission modifiée : ${(data.libelle ?? before.libelle).trim() || before.libelle}`,
    montant,
    refId: id,
  });
}

export function deleteCommission(id: number, userId?: number | null): void {
  const before = one<Commission>(`SELECT * FROM commission WHERE id = ?`, id);
  run(`DELETE FROM commission WHERE id = ?`, id);
  journaliser({
    userId,
    action: "suppression",
    entite: "commission",
    details: `Commission supprimée${before ? ` : ${before.libelle}` : ""}`,
    montant: before?.montant ?? null,
    refId: id,
  });
}

export function commissionsDuMois(year: number, month: number): Commission[] {
  const { debut, fin } = bornesMois(year, month);
  return all<Commission>(
    `SELECT * FROM commission WHERE date >= ? AND date < ? ORDER BY date DESC, id DESC`,
    debut,
    fin
  );
}

export function totalCommissionsMois(year: number, month: number): number {
  const { debut, fin } = bornesMois(year, month);
  return (
    one<{ total: number }>(
      `SELECT COALESCE(SUM(montant), 0) AS total FROM commission WHERE date >= ? AND date < ?`,
      debut,
      fin
    )?.total ?? 0
  );
}
