// Repository ventes — une vente baisse le stock dans une transaction. Aucune caisse à ouvrir.
import { all, one, run, tx, nowIso } from "../db";
import { journaliser } from "./activite";
import { bornesJour } from "../periodes";

export type Paiement = "especes" | "tmoney" | "flooz" | "credit";

export type Vente = {
  id: number;
  date: string;
  paiement: Paiement;
  total: number;
  note: string | null;
  user_id: number | null;
};

export type LigneVente = {
  id: number;
  vente_id: number;
  produit_id: number | null;
  nom_produit: string;
  quantite: number;
  prix_unitaire: number;
  cout_unitaire: number;
  frais_unitaire: number;
  total: number;
};

export type VenteAvecLignes = Vente & { lignes: LigneVente[] };

export function listVentesDuJour(): VenteAvecLignes[] {
  const { debut, fin } = bornesJour();
  const ventes = all<Vente>(
    `SELECT * FROM vente WHERE date >= ? AND date < ? ORDER BY date DESC, id DESC`,
    debut,
    fin
  );
  return ventes.map((v) => ({
    ...v,
    lignes: all<LigneVente>(
      `SELECT * FROM ligne_vente WHERE vente_id = ? ORDER BY id`,
      v.id
    ),
  }));
}

export type CreateVenteInput = {
  paiement: Paiement;
  lignes: { produitId: number; quantite: number }[];
  note?: string | null;
  userId?: number | null;
};

export function createVente(input: CreateVenteInput): number {
  if (!input.lignes.length) throw new Error("Aucun produit dans la vente.");

  return tx(() => {
    const now = nowIso();
    const venteId = run(
      `INSERT INTO vente (date, paiement, total, note, user_id) VALUES (?,?,?,?,?)`,
      now,
      input.paiement,
      0,
      input.note ?? null,
      input.userId ?? null
    ).lastId;

    let total = 0;
    for (const l of input.lignes) {
      if (l.quantite <= 0) continue;
      const prod = one<{
        nom: string;
        prix_vente: number;
        prix_achat: number;
        frais: number;
        stock: number;
      }>(
        `SELECT nom, prix_vente, prix_achat, frais, stock FROM produit WHERE id = ?`,
        l.produitId
      );
      if (!prod) throw new Error("Produit introuvable dans la vente.");

      const ligneTotal = prod.prix_vente * l.quantite;
      total += ligneTotal;

      run(
        `INSERT INTO ligne_vente
           (vente_id, produit_id, nom_produit, quantite, prix_unitaire, cout_unitaire, frais_unitaire, total)
         VALUES (?,?,?,?,?,?,?,?)`,
        venteId,
        l.produitId,
        prod.nom,
        l.quantite,
        prod.prix_vente,
        prod.prix_achat,
        prod.frais,
        ligneTotal
      );

      const stockAvant = prod.stock;
      const stockApres = stockAvant - l.quantite;
      run(
        `UPDATE produit SET stock = ?, maj_le = ? WHERE id = ?`,
        stockApres,
        now,
        l.produitId
      );
      run(
        `INSERT INTO mouvement_stock
           (produit_id, type, quantite, stock_avant, stock_apres, raison, ref_id, user_id, date)
         VALUES (?,?,?,?,?,?,?,?,?)`,
        l.produitId,
        "vente",
        -l.quantite,
        stockAvant,
        stockApres,
        "Vente",
        venteId,
        input.userId ?? null,
        now
      );
    }

    run(`UPDATE vente SET total = ? WHERE id = ?`, total, venteId);
    journaliser({
      userId: input.userId,
      action: "creation",
      entite: "vente",
      details: `Vente encaissée (${input.paiement})`,
      montant: total,
      refId: venteId,
    });
    return venteId;
  });
}

export type UpdateVenteInput = {
  paiement?: Paiement;
  // quantite = 0 retire la ligne. Le stock se réajuste de la différence.
  lignes?: { ligneId: number; quantite: number }[];
  userId?: number | null; // l'auteur de la modification, pour le journal
};

export function updateVente(id: number, input: UpdateVenteInput): void {
  const vente = one<Vente>(`SELECT * FROM vente WHERE id = ?`, id);
  if (!vente) throw new Error("Vente introuvable.");

  tx(() => {
    const now = nowIso();

    if (input.paiement) {
      run(`UPDATE vente SET paiement = ? WHERE id = ?`, input.paiement, id);
    }

    for (const chg of input.lignes ?? []) {
      const ligne = one<LigneVente>(
        `SELECT * FROM ligne_vente WHERE id = ? AND vente_id = ?`,
        chg.ligneId,
        id
      );
      if (!ligne) continue;

      const nouvelleQte = Math.max(0, Math.round(chg.quantite));
      const delta = nouvelleQte - ligne.quantite; // vendu en plus => le stock baisse

      if (delta !== 0 && ligne.produit_id != null) {
        const prod = one<{ stock: number }>(
          `SELECT stock FROM produit WHERE id = ?`,
          ligne.produit_id
        );
        const stockAvant = prod?.stock ?? 0;
        const stockApres = stockAvant - delta;
        run(
          `UPDATE produit SET stock = ?, maj_le = ? WHERE id = ?`,
          stockApres,
          now,
          ligne.produit_id
        );
        run(
          `INSERT INTO mouvement_stock
             (produit_id, type, quantite, stock_avant, stock_apres, raison, ref_id, user_id, date)
           VALUES (?,?,?,?,?,?,?,?,?)`,
          ligne.produit_id,
          "correction",
          -delta,
          stockAvant,
          stockApres,
          "Correction de vente",
          id,
          vente.user_id,
          now
        );
      }

      if (nouvelleQte === 0) {
        run(`DELETE FROM ligne_vente WHERE id = ?`, ligne.id);
      } else {
        run(
          `UPDATE ligne_vente SET quantite = ?, total = ? WHERE id = ?`,
          nouvelleQte,
          ligne.prix_unitaire * nouvelleQte,
          ligne.id
        );
      }
    }

    const reste = one<{ n: number; total: number }>(
      `SELECT COUNT(*) AS n, COALESCE(SUM(total), 0) AS total
         FROM ligne_vente WHERE vente_id = ?`,
      id
    );
    if (!reste || reste.n === 0) {
      // Plus aucune ligne : on retire la vente vide (le stock a déjà été remis).
      run(`DELETE FROM vente WHERE id = ?`, id);
      journaliser({
        userId: input.userId,
        action: "suppression",
        entite: "vente",
        details: "Vente vidée puis supprimée",
        refId: id,
      });
    } else {
      run(`UPDATE vente SET total = ? WHERE id = ?`, reste.total, id);
      journaliser({
        userId: input.userId,
        action: "modification",
        entite: "vente",
        details: "Vente modifiée",
        montant: reste.total,
        refId: id,
      });
    }
  });
}

export function deleteVente(id: number, userId?: number | null): void {
  const lignes = all<LigneVente>(
    `SELECT * FROM ligne_vente WHERE vente_id = ?`,
    id
  );
  if (!one(`SELECT id FROM vente WHERE id = ?`, id)) return;

  tx(() => {
    const now = nowIso();
    for (const l of lignes) {
      if (l.produit_id == null) continue;
      const prod = one<{ stock: number }>(
        `SELECT stock FROM produit WHERE id = ?`,
        l.produit_id
      );
      const stockAvant = prod?.stock ?? 0;
      const stockApres = stockAvant + l.quantite; // on remet le stock
      run(
        `UPDATE produit SET stock = ?, maj_le = ? WHERE id = ?`,
        stockApres,
        now,
        l.produit_id
      );
      run(
        `INSERT INTO mouvement_stock
           (produit_id, type, quantite, stock_avant, stock_apres, raison, ref_id, user_id, date)
         VALUES (?,?,?,?,?,?,?,?,?)`,
        l.produit_id,
        "correction",
        l.quantite,
        stockAvant,
        stockApres,
        "Suppression de vente",
        id,
        null,
        now
      );
    }
    // ligne_vente est supprimée en cascade (ON DELETE CASCADE).
    run(`DELETE FROM vente WHERE id = ?`, id);
    journaliser({
      userId,
      action: "suppression",
      entite: "vente",
      details: "Vente supprimée",
      refId: id,
    });
  });
}
