// Repository dépenses — tout ce qui sort de la caisse (loyer, salaires, transport, taxes…).
// Sert à calculer la marge RÉELLE : marge sur marchandise − dépenses du mois.
import { all, one, run, nowIso } from "../db";

export type Depense = {
  id: number;
  libelle: string;
  montant: number;
  categorie: string | null;
  recurrente: number; // 0 | 1 — revient chaque mois
  date: string;
  user_id: number | null;
};

function bornesDuMois(year: number, month: number): { debut: string; fin: string } {
  // month : 1–12. Le Togo est à GMT, donc heure locale = UTC (pas de décalage).
  const debut = new Date(year, month - 1, 1, 0, 0, 0, 0);
  const fin = new Date(year, month, 1, 0, 0, 0, 0);
  return { debut: debut.toISOString(), fin: fin.toISOString() };
}

export type CreateDepenseInput = {
  libelle: string;
  montant: number;
  categorie?: string | null;
  recurrente?: boolean;
  date?: string | null; // "YYYY-MM-DD" ; sinon maintenant
  userId?: number | null;
};

function isoDepuisJour(jour?: string | null): string {
  if (jour && /^\d{4}-\d{2}-\d{2}$/.test(jour)) return `${jour}T12:00:00.000Z`;
  return nowIso();
}

export function createDepense(input: CreateDepenseInput): number {
  const libelle = input.libelle.trim();
  if (!libelle) throw new Error("Libellé manquant.");
  return run(
    `INSERT INTO depense (libelle, montant, categorie, recurrente, date, user_id)
     VALUES (?,?,?,?,?,?)`,
    libelle,
    Math.round(input.montant),
    input.categorie ?? null,
    input.recurrente ? 1 : 0,
    isoDepuisJour(input.date),
    input.userId ?? null
  ).lastId;
}

export function updateDepense(
  id: number,
  data: {
    libelle?: string;
    montant?: number;
    categorie?: string | null;
    recurrente?: boolean;
    date?: string | null;
  }
): void {
  const before = one<Depense>(`SELECT * FROM depense WHERE id = ?`, id);
  if (!before) throw new Error("Dépense introuvable.");
  run(
    `UPDATE depense SET libelle = ?, montant = ?, categorie = ?, recurrente = ?, date = ?
     WHERE id = ?`,
    (data.libelle ?? before.libelle).trim() || before.libelle,
    data.montant != null ? Math.round(data.montant) : before.montant,
    data.categorie !== undefined ? data.categorie : before.categorie,
    data.recurrente !== undefined ? (data.recurrente ? 1 : 0) : before.recurrente,
    data.date ? isoDepuisJour(data.date) : before.date,
    id
  );
}

export function deleteDepense(id: number): void {
  run(`DELETE FROM depense WHERE id = ?`, id);
}

export function depensesDuMois(year: number, month: number): Depense[] {
  const { debut, fin } = bornesDuMois(year, month);
  return all<Depense>(
    `SELECT * FROM depense WHERE date >= ? AND date < ? ORDER BY date DESC, id DESC`,
    debut,
    fin
  );
}

export function totalDepensesMois(year: number, month: number): number {
  const { debut, fin } = bornesDuMois(year, month);
  return (
    one<{ total: number }>(
      `SELECT COALESCE(SUM(montant), 0) AS total FROM depense WHERE date >= ? AND date < ?`,
      debut,
      fin
    )?.total ?? 0
  );
}
