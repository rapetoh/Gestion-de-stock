// Repository comptes & soldes — la réconciliation quotidienne de l'argent.
// Sa question n°1 : "est-ce que ça tombe juste ?" Pour chaque compte (Espèces, TMoney, Flooz,
// Crédit) on compare ce qui DEVRAIT être là (attendu / capital-float) à ce qui est VRAIMENT là
// (compté). La somme des manques = perte possible. Pas de journal transaction par transaction
// (c'est la surcharge qui a tué la 1re appli) — juste les soldes, comme dans son cahier.
import { all, one, run, tx } from "../db";
import { journaliser } from "./activite";
import { bornesJour } from "../periodes";

export type Compte = {
  id: number;
  nom: string;
  type: "especes" | "tmoney" | "flooz" | "credit";
  actif: number;
};

// D'où vient l'attendu calculé : dernier comptage + ventes du compte − dépenses (espèces) depuis.
export type AttenduDetail = {
  baseline: number; // dernier solde réellement compté
  baselineJour: string | null; // jour de ce dernier comptage (YYYY-MM-DD), null si jamais
  ventes: number; // ventes encaissées sur ce compte depuis
  depenses: number; // dépenses sorties de la caisse depuis (espèces uniquement)
};

export type LigneReconciliation = {
  compte_id: number;
  nom: string;
  type: string;
  attendu: number;
  compte: number | null; // null = pas encore compté ce jour
  ecart: number; // compté − attendu (négatif = manque)
  detail?: AttenduDetail | null; // explication de l'attendu (null si déjà compté ce jour)
};

export type Reconciliation = {
  jour: string; // YYYY-MM-DD
  lignes: LigneReconciliation[];
  totaux: { attendu: number; compte: number; ecart: number; comptes: number };
};

export function listComptesActifs(): Compte[] {
  return all<Compte>(`SELECT * FROM compte WHERE actif = 1 ORDER BY id`);
}

// Ventes encaissées sur un compte (par moyen de paiement) dans [debut, fin).
function sommeVentes(type: string, debut: string, fin: string): number {
  return (
    one<{ t: number }>(
      `SELECT COALESCE(SUM(total), 0) AS t FROM vente
        WHERE paiement = ? AND date >= ? AND date < ?`,
      type,
      debut,
      fin
    )?.t ?? 0
  );
}

// Dépenses sorties de la caisse (espèces) dans [debut, fin) — lignes réelles, pas le report récurrent.
function sommeDepenses(debut: string, fin: string): number {
  return (
    one<{ t: number }>(
      `SELECT COALESCE(SUM(montant), 0) AS t FROM depense WHERE date >= ? AND date < ?`,
      debut,
      fin
    )?.t ?? 0
  );
}

// Attendu CALCULÉ pour un compte un jour donné : on part du dernier solde réellement compté,
// puis on ajoute les ventes de ce compte et on retire les dépenses (espèces) survenues depuis.
// C'est ça qui répond vraiment à « est-ce que ça tombe juste ? » sans qu'elle calcule à la main.
function attenduCalcule(compte: Compte, jour: string): {
  attendu: number;
  detail: AttenduDetail;
} {
  const debutJour = bornesJour(jour).debut;
  const finJour = bornesJour(jour).fin;

  // Dernier comptage STRICTEMENT avant ce jour.
  const last = one<{ date: string; solde: number }>(
    `SELECT date, solde FROM solde_journalier
      WHERE compte_id = ? AND date < ? ORDER BY date DESC, id DESC LIMIT 1`,
    compte.id,
    debutJour
  );
  const baseline = last?.solde ?? 0;
  const baselineJour = last ? last.date.slice(0, 10) : null;
  // Fenêtre : du lendemain du dernier comptage (son solde inclut déjà sa journée) jusqu'à la fin du jour visé.
  const fenetreDebut = last ? bornesJour(baselineJour as string).fin : "0000-01-01T00:00:00.000Z";

  const ventes = sommeVentes(compte.type, fenetreDebut, finJour);
  const depenses = compte.type === "especes" ? sommeDepenses(fenetreDebut, finJour) : 0;
  const attendu = baseline + ventes - depenses;

  return { attendu, detail: { baseline, baselineJour, ventes, depenses } };
}

// État d'un jour : pour chaque compte actif, l'attendu (celui du jour s'il existe, sinon le
// dernier connu reporté) et le solde compté du jour s'il a été saisi.
export function reconciliationDuJour(jour: string): Reconciliation {
  const { debut, fin } = bornesJour(jour);
  const comptes = listComptesActifs();

  const lignes: LigneReconciliation[] = comptes.map((c) => {
    const duJour = one<{ attendu: number; solde: number }>(
      `SELECT attendu, solde FROM solde_journalier
        WHERE compte_id = ? AND date >= ? AND date < ?
        ORDER BY id DESC LIMIT 1`,
      c.id,
      debut,
      fin
    );
    if (duJour) {
      // Déjà compté ce jour : on montre ce qui a été enregistré.
      return {
        compte_id: c.id,
        nom: c.nom,
        type: c.type,
        attendu: duJour.attendu,
        compte: duJour.solde,
        ecart: duJour.solde - duJour.attendu,
        detail: null,
      };
    }
    // Pas encore compté : l'attendu est CALCULÉ depuis le dernier comptage + l'activité du jour.
    const { attendu, detail } = attenduCalcule(c, jour);
    return {
      compte_id: c.id,
      nom: c.nom,
      type: c.type,
      attendu,
      compte: null,
      ecart: 0,
      detail,
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

  const { debut, fin } = bornesJour(input.jour);
  const dateIso = `${input.jour}T12:00:00.000Z`;

  tx(() => {
    for (const l of valides) {
      // Un seul enregistrement par compte et par jour : on remplace.
      run(
        `DELETE FROM solde_journalier WHERE compte_id = ? AND date >= ? AND date < ?`,
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
