// Repository dépenses — tout ce qui sort de la caisse (loyer, salaires, transport, taxes…).
// Sert à calculer la marge RÉELLE : marge sur marchandise − dépenses du mois.
//
// Dépenses récurrentes (« revient chaque mois ») : on ne les ressaisit PAS chaque mois.
// Une dépense cochée récurrente compte dans son mois de départ ET dans tous les mois suivants
// (loyer, salaires, électricité…). C'est calculé à la lecture (`date < fin du mois`), sans
// recopier de lignes ni toucher le passé. La supprimer l'enlève des mois suivants.
import { all, one, run, nowIso } from "../db";
import { journaliser } from "./activite";
import { bornesMois } from "../periodes";

export type Depense = {
  id: number;
  libelle: string;
  montant: number;
  categorie: string | null;
  recurrente: number; // 0 | 1 — revient chaque mois
  date: string;
  user_id: number | null;
};

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
  const id = run(
    `INSERT INTO depense (libelle, montant, categorie, recurrente, date, user_id)
     VALUES (?,?,?,?,?,?)`,
    libelle,
    Math.round(input.montant),
    input.categorie ?? null,
    input.recurrente ? 1 : 0,
    isoDepuisJour(input.date),
    input.userId ?? null
  ).lastId;
  journaliser({
    userId: input.userId,
    action: "creation",
    entite: "depense",
    details: `Dépense : ${libelle}`,
    montant: Math.round(input.montant),
    refId: id,
  });
  return id;
}

export function updateDepense(
  id: number,
  data: {
    libelle?: string;
    montant?: number;
    categorie?: string | null;
    recurrente?: boolean;
    date?: string | null;
  },
  userId?: number | null
): void {
  const before = one<Depense>(`SELECT * FROM depense WHERE id = ?`, id);
  if (!before) throw new Error("Dépense introuvable.");
  const montant = data.montant != null ? Math.round(data.montant) : before.montant;
  run(
    `UPDATE depense SET libelle = ?, montant = ?, categorie = ?, recurrente = ?, date = ?
     WHERE id = ?`,
    (data.libelle ?? before.libelle).trim() || before.libelle,
    montant,
    data.categorie !== undefined ? data.categorie : before.categorie,
    data.recurrente !== undefined ? (data.recurrente ? 1 : 0) : before.recurrente,
    data.date ? isoDepuisJour(data.date) : before.date,
    id
  );
  journaliser({
    userId,
    action: "modification",
    entite: "depense",
    details: `Dépense modifiée : ${(data.libelle ?? before.libelle).trim() || before.libelle}`,
    montant,
    refId: id,
  });
}

export function deleteDepense(id: number, userId?: number | null): void {
  const before = one<Depense>(`SELECT * FROM depense WHERE id = ?`, id);
  run(`DELETE FROM depense WHERE id = ?`, id);
  journaliser({
    userId,
    action: "suppression",
    entite: "depense",
    details: `Dépense supprimée${before ? ` : ${before.libelle}` : ""}`,
    montant: before?.montant ?? null,
    refId: id,
  });
}

// Une dépense compte dans le mois si :
//   - ponctuelle (recurrente = 0) et datée DANS le mois, OU
//   - récurrente (recurrente = 1) et démarrée AVANT la fin du mois (donc reportée tous les mois).
const CLAUSE_MOIS =
  "((recurrente = 0 AND date >= ? AND date < ?) OR (recurrente = 1 AND date < ?))";

export function depensesDuMois(year: number, month: number): Depense[] {
  const { debut, fin } = bornesMois(year, month);
  return all<Depense>(
    `SELECT * FROM depense WHERE ${CLAUSE_MOIS}
      ORDER BY recurrente DESC, date DESC, id DESC`,
    debut,
    fin,
    fin
  );
}

export function totalDepensesMois(year: number, month: number): number {
  const { debut, fin } = bornesMois(year, month);
  return (
    one<{ total: number }>(
      `SELECT COALESCE(SUM(montant), 0) AS total FROM depense WHERE ${CLAUSE_MOIS}`,
      debut,
      fin,
      fin
    )?.total ?? 0
  );
}
