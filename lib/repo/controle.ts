// Repository contrôle de stock — l'outil anti-vol.
// On compte ce qu'il y a vraiment sur l'étagère, on le compare au stock théorique
// (ce que la machine croit), et l'écart négatif = manque = vol/perte possible, chiffré en CFA.
// Enregistrer un contrôle corrige aussi le stock pour qu'il redevienne vrai, avec une trace.
import { all, one, run, tx, nowIso } from "../db";

export type Controle = {
  id: number;
  date: string;
  note: string | null;
  user_id: number | null;
};

export type LigneControle = {
  id: number;
  controle_id: number;
  produit_id: number;
  nom: string; // joint depuis produit pour l'affichage
  theorique: number;
  compte: number;
  ecart: number; // compté − théorique (négatif = manque)
  valeur_ecart: number; // ecart × coût de revient unitaire
};

export type ControleResume = Controle & {
  nb_produits: number;
  manque: number; // valeur totale manquante (positive)
  surplus: number; // valeur totale en trop (positive)
};

export type EnregistrerControleInput = {
  note?: string | null;
  userId?: number | null;
  // Seuls les produits réellement comptés sont passés (compté >= 0).
  lignes: { produitId: number; compte: number }[];
};

export function enregistrerControle(input: EnregistrerControleInput): number {
  const lignes = input.lignes.filter(
    (l) => l.produitId > 0 && Number.isFinite(l.compte) && l.compte >= 0
  );
  if (!lignes.length) throw new Error("Aucun produit compté.");

  return tx(() => {
    const now = nowIso();
    const controleId = run(
      `INSERT INTO controle_stock (date, note, user_id) VALUES (?,?,?)`,
      now,
      input.note ?? null,
      input.userId ?? null
    ).lastId;

    for (const l of lignes) {
      const prod = one<{ stock: number; prix_achat: number; frais: number }>(
        `SELECT stock, prix_achat, frais FROM produit WHERE id = ?`,
        l.produitId
      );
      if (!prod) continue;

      const theorique = prod.stock;
      const compte = Math.round(l.compte);
      const ecart = compte - theorique;
      const coutUnit = prod.prix_achat + prod.frais; // coût de revient unitaire
      const valeurEcart = ecart * coutUnit;

      run(
        `INSERT INTO ligne_controle
           (controle_id, produit_id, theorique, compte, ecart, valeur_ecart)
         VALUES (?,?,?,?,?,?)`,
        controleId,
        l.produitId,
        theorique,
        compte,
        ecart,
        valeurEcart
      );

      // Le stock devient ce qui a vraiment été compté, avec une trace dans l'historique.
      if (ecart !== 0) {
        run(
          `UPDATE produit SET stock = ?, maj_le = ? WHERE id = ?`,
          compte,
          now,
          l.produitId
        );
        run(
          `INSERT INTO mouvement_stock
             (produit_id, type, quantite, stock_avant, stock_apres, raison, ref_id, user_id, date)
           VALUES (?,?,?,?,?,?,?,?,?)`,
          l.produitId,
          "controle",
          ecart,
          theorique,
          compte,
          "Contrôle de stock",
          controleId,
          input.userId ?? null,
          now
        );
      }
    }

    return controleId;
  });
}

export function listControles(limit = 20): ControleResume[] {
  return all<ControleResume>(
    `SELECT c.*,
            COUNT(lc.id) AS nb_produits,
            COALESCE(SUM(CASE WHEN lc.ecart < 0 THEN -lc.valeur_ecart ELSE 0 END), 0) AS manque,
            COALESCE(SUM(CASE WHEN lc.ecart > 0 THEN lc.valeur_ecart ELSE 0 END), 0) AS surplus
       FROM controle_stock c
       LEFT JOIN ligne_controle lc ON lc.controle_id = c.id
      GROUP BY c.id
      ORDER BY c.date DESC, c.id DESC
      LIMIT ?`,
    limit
  );
}

export function getControle(
  id: number
): { controle: Controle; lignes: LigneControle[] } | null {
  const controle = one<Controle>(
    `SELECT * FROM controle_stock WHERE id = ?`,
    id
  );
  if (!controle) return null;
  const lignes = all<LigneControle>(
    `SELECT lc.*, p.nom AS nom
       FROM ligne_controle lc
       JOIN produit p ON p.id = lc.produit_id
      WHERE lc.controle_id = ?
      ORDER BY lc.ecart ASC, p.nom`,
    id
  );
  return { controle, lignes };
}
