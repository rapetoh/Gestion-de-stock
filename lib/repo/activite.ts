// Repository activité — le journal "qui a fait quoi, et quand".
// Écrit depuis les autres repos, au moment où la donnée change (donc dans la même transaction
// quand il y en a une). Best-effort : une erreur de log ne doit JAMAIS casser l'opération métier.
import { all, run, nowIso } from "../db";

export type Action =
  | "creation"
  | "modification"
  | "suppression"
  | "controle"
  | "soldes"
  | "connexion";

export type JournaliserInput = {
  userId?: number | null;
  action: Action;
  entite: string; // vente | achat | produit | depense | controle | soldes | session
  details: string;
  montant?: number | null;
  refId?: number | null;
};

export function journaliser(input: JournaliserInput): void {
  try {
    run(
      `INSERT INTO activite (date, user_id, action, entite, details, montant, ref_id)
       VALUES (?,?,?,?,?,?,?)`,
      nowIso(),
      input.userId ?? null,
      input.action,
      input.entite,
      input.details,
      input.montant ?? null,
      input.refId ?? null
    );
  } catch (e) {
    console.error("journaliser (ignoré) :", e);
  }
}

export type LigneActivite = {
  id: number;
  date: string;
  user_id: number | null;
  user_nom: string | null;
  action: string;
  entite: string | null;
  details: string;
  montant: number | null;
  ref_id: number | null;
};

export function listActivite(opts?: {
  limit?: number;
  action?: string;
  jour?: string; // YYYY-MM-DD
}): LigneActivite[] {
  const where: string[] = [];
  const params: unknown[] = [];
  if (opts?.action) {
    where.push("a.action = ?");
    params.push(opts.action);
  }
  if (opts?.jour && /^\d{4}-\d{2}-\d{2}$/.test(opts.jour)) {
    where.push("a.date >= ? AND a.date <= ?");
    params.push(`${opts.jour}T00:00:00.000Z`, `${opts.jour}T23:59:59.999Z`);
  }
  const clause = where.length ? `WHERE ${where.join(" AND ")}` : "";
  params.push(opts?.limit ?? 100);
  return all<LigneActivite>(
    `SELECT a.*, u.nom AS user_nom
       FROM activite a
       LEFT JOIN utilisateur u ON u.id = a.user_id
       ${clause}
      ORDER BY a.date DESC, a.id DESC
      LIMIT ?`,
    ...params
  );
}
