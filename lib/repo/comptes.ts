// Repository comptes & soldes — la réconciliation quotidienne de l'argent.
// Sa question n°1 : "est-ce que ça tombe juste ?" Pour chaque compte (Espèces, TMoney, Flooz,
// Crédit) on compare ce qui DEVRAIT être là (attendu / capital-float) à ce qui est VRAIMENT là
// (compté). La somme des manques = perte possible. Pas de journal transaction par transaction
// (c'est la surcharge qui a tué la 1re appli) — juste les soldes, comme dans son cahier.
import { all, one, run, tx } from "../db";
import { journaliser } from "./activite";

export type Compte = {
  id: number;
  nom: string;
  type: "especes" | "tmoney" | "flooz" | "credit";
  actif: number;
};

export type LigneReconciliation = {
  compte_id: number;
  nom: string;
  type: string;
  attendu: number;
  compte: number | null; // null = pas encore compté ce jour
  ecart: number; // compté − attendu (négatif = manque)
};

export type Reconciliation = {
  jour: string; // YYYY-MM-DD
  lignes: LigneReconciliation[];
  totaux: { attendu: number; compte: number; ecart: number; comptes: number };
};

function bornesDuJour(jour: string): { debut: string; fin: string } {
  // jour = YYYY-MM-DD ; le Togo est à GMT donc jour local = jour UTC.
  return { debut: `${jour}T00:00:00.000Z`, fin: `${jour}T23:59:59.999Z` };
}

export function listComptesActifs(): Compte[] {
  return all<Compte>(`SELECT * FROM compte WHERE actif = 1 ORDER BY id`);
}

// État d'un jour : pour chaque compte actif, l'attendu (celui du jour s'il existe, sinon le
// dernier connu reporté) et le solde compté du jour s'il a été saisi.
export function reconciliationDuJour(jour: string): Reconciliation {
  const { debut, fin } = bornesDuJour(jour);
  const comptes = listComptesActifs();

  const lignes: LigneReconciliation[] = comptes.map((c) => {
    const duJour = one<{ attendu: number; solde: number }>(
      `SELECT attendu, solde FROM solde_journalier
        WHERE compte_id = ? AND date >= ? AND date <= ?
        ORDER BY id DESC LIMIT 1`,
      c.id,
      debut,
      fin
    );
    let attendu: number;
    let compte: number | null;
    if (duJour) {
      attendu = duJour.attendu;
      compte = duJour.solde;
    } else {
      // Reporter le dernier attendu connu (le capital ne change pas tous les jours).
      attendu =
        one<{ attendu: number }>(
          `SELECT attendu FROM solde_journalier
            WHERE compte_id = ? AND date < ? ORDER BY date DESC, id DESC LIMIT 1`,
          c.id,
          fin
        )?.attendu ?? 0;
      compte = null;
    }
    return {
      compte_id: c.id,
      nom: c.nom,
      type: c.type,
      attendu,
      compte,
      ecart: compte == null ? 0 : compte - attendu,
    };
  });

  const comptees = lignes.filter((l) => l.compte != null);
  const totaux = {
    attendu: comptees.reduce((s, l) => s + l.attendu, 0),
    compte: comptees.reduce((s, l) => s + (l.compte ?? 0), 0),
    ecart: comptees.reduce((s, l) => s + l.ecart, 0),
    comptes: comptees.length,
  };

  return { jour, lignes, totaux };
}

export type EnregistrerReconciliationInput = {
  jour: string; // YYYY-MM-DD
  // Seuls les comptes réellement comptés sont passés (compte >= 0). attendu est sauvegardé avec.
  lignes: { compteId: number; attendu: number; compte: number }[];
  userId?: number | null; // l'auteur, pour le journal
};

export function enregistrerReconciliation(
  input: EnregistrerReconciliationInput
): void {
  const valides = input.lignes.filter(
    (l) =>
      l.compteId > 0 &&
      Number.isFinite(l.compte) &&
      l.compte >= 0 &&
      Number.isFinite(l.attendu)
  );
  if (!valides.length) throw new Error("Aucun solde compté.");

  const { debut, fin } = bornesDuJour(input.jour);
  const dateIso = `${input.jour}T12:00:00.000Z`;

  tx(() => {
    for (const l of valides) {
      // Un seul enregistrement par compte et par jour : on remplace.
      run(
        `DELETE FROM solde_journalier WHERE compte_id = ? AND date >= ? AND date <= ?`,
        l.compteId,
        debut,
        fin
      );
      run(
        `INSERT INTO solde_journalier (compte_id, date, attendu, solde) VALUES (?,?,?,?)`,
        l.compteId,
        dateIso,
        Math.round(l.attendu),
        Math.round(l.compte)
      );
    }

    const ecart = valides.reduce((s, l) => s + (l.compte - l.attendu), 0);
    journaliser({
      userId: input.userId,
      action: "soldes",
      entite: "soldes",
      details: `Soldes du ${input.jour} (${valides.length} comptes)`,
      montant: ecart,
    });
  });
}

export type JourResume = {
  jour: string;
  attendu: number;
  compte: number;
  ecart: number;
  comptes: number;
};

export function historiqueReconciliations(limit = 14): JourResume[] {
  return all<JourResume>(
    `SELECT date(date) AS jour,
            SUM(attendu) AS attendu,
            SUM(solde)   AS compte,
            SUM(solde) - SUM(attendu) AS ecart,
            COUNT(*)     AS comptes
       FROM solde_journalier
      GROUP BY date(date)
      ORDER BY jour DESC
      LIMIT ?`,
    limit
  );
}
