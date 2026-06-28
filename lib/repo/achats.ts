// Repository achats — chaque achat met à jour le produit et le stock dans une transaction.
import { all, one, run, tx, nowIso } from "../db";
import { journaliser } from "./activite";

export type Achat = {
  id: number;
  produit_id: number;
  quantite: number;
  prix_achat: number; // prix d'achat unitaire (hors frais)
  frais: number; // frais de transport pour tout le lot
  prix_vente: number;
  fournisseur: string | null;
  note: string | null;
  date: string;
  user_id: number | null;
};

export type AchatAvecProduit = Achat & { nom: string };

export function listAchats(limit = 20): AchatAvecProduit[] {
  return all<AchatAvecProduit>(
    `SELECT a.*, p.nom AS nom
       FROM achat a
       JOIN produit p ON p.id = a.produit_id
      ORDER BY a.date DESC, a.id DESC
      LIMIT ?`,
    limit
  );
}

export type CreateAchatInput = {
  produitId: number;
  quantite: number;
  prixAchat: number;
  frais: number; // frais du lot (réparti à l'unité sur le produit)
  prixVente: number;
  fournisseur?: string | null;
  note?: string | null;
  userId?: number | null;
};

export function createAchat(input: CreateAchatInput): number {
  return tx(() => {
    const now = nowIso();
    const prod = one<{ stock: number }>(
      `SELECT stock FROM produit WHERE id = ?`,
      input.produitId
    );
    if (!prod) throw new Error("Produit introuvable.");

    const stockAvant = prod.stock;
    const stockApres = stockAvant + input.quantite;
    const fraisUnit =
      input.quantite > 0 ? Math.round(input.frais / input.quantite) : 0;

    const achatId = run(
      `INSERT INTO achat
         (produit_id, quantite, prix_achat, frais, prix_vente, fournisseur, note, date, user_id)
       VALUES (?,?,?,?,?,?,?,?,?)`,
      input.produitId,
      input.quantite,
      input.prixAchat,
      input.frais,
      input.prixVente,
      input.fournisseur ?? null,
      input.note ?? null,
      now,
      input.userId ?? null
    ).lastId;

    // Le produit reflète le DERNIER achat : coût (prix_achat + frais unitaires) et prix de vente.
    // Le formulaire pré-remplit ces valeurs avec celles du produit et prévient si le prix de vente
    // change (ré-étiquetage), donc cette mise à jour est volontaire, jamais une surprise silencieuse.
    // NB : modifier un achat passé (updateAchat) ne réécrit PAS le prix courant du produit — sinon
    // corriger une vieille ligne changerait le prix d'aujourd'hui.
    run(
      `UPDATE produit SET
         prix_achat = ?, frais = ?, prix_vente = ?, stock = ?, maj_le = ?
       WHERE id = ?`,
      input.prixAchat,
      fraisUnit,
      input.prixVente,
      stockApres,
      now,
      input.produitId
    );

    run(
      `INSERT INTO mouvement_stock
         (produit_id, type, quantite, stock_avant, stock_apres, raison, ref_id, user_id, date)
       VALUES (?,?,?,?,?,?,?,?,?)`,
      input.produitId,
      "achat",
      input.quantite,
      stockAvant,
      stockApres,
      "Achat",
      achatId,
      input.userId ?? null,
      now
    );

    journaliser({
      userId: input.userId,
      action: "creation",
      entite: "achat",
      details: `Achat enregistré (qté ${input.quantite})`,
      montant: input.prixAchat * input.quantite + input.frais,
      refId: achatId,
    });

    return achatId;
  });
}

export function updateAchat(
  id: number,
  data: { quantite?: number; prixAchat?: number; frais?: number; prixVente?: number; fournisseur?: string | null; note?: string | null },
  userId?: number | null
): void {
  const before = one<Achat>(`SELECT * FROM achat WHERE id = ?`, id);
  if (!before) throw new Error("Achat introuvable.");

  tx(() => {
    const now = nowIso();
    const nouvelleQte = data.quantite ?? before.quantite;
    const prixAchat = data.prixAchat ?? before.prix_achat;
    const frais = data.frais ?? before.frais;
    const prixVente = data.prixVente ?? before.prix_vente;

    run(
      `UPDATE achat SET
         quantite = ?, prix_achat = ?, frais = ?, prix_vente = ?, fournisseur = ?, note = ?
       WHERE id = ?`,
      nouvelleQte,
      prixAchat,
      frais,
      prixVente,
      data.fournisseur ?? before.fournisseur,
      data.note ?? before.note,
      id
    );

    // Réajuster le stock de la différence de quantité.
    const delta = nouvelleQte - before.quantite;
    if (delta !== 0) {
      const prod = one<{ stock: number }>(
        `SELECT stock FROM produit WHERE id = ?`,
        before.produit_id
      );
      const stockAvant = prod?.stock ?? 0;
      const stockApres = stockAvant + delta;
      run(
        `UPDATE produit SET stock = ?, maj_le = ? WHERE id = ?`,
        stockApres,
        now,
        before.produit_id
      );
      run(
        `INSERT INTO mouvement_stock
           (produit_id, type, quantite, stock_avant, stock_apres, raison, ref_id, user_id, date)
         VALUES (?,?,?,?,?,?,?,?,?)`,
        before.produit_id,
        "correction",
        delta,
        stockAvant,
        stockApres,
        "Correction d'achat",
        id,
        before.user_id,
        now
      );
    }

    journaliser({
      userId,
      action: "modification",
      entite: "achat",
      details: `Achat modifié (qté ${before.quantite} → ${nouvelleQte})`,
      refId: id,
    });
  });
}

export function deleteAchat(id: number, userId?: number | null): void {
  const before = one<Achat>(`SELECT * FROM achat WHERE id = ?`, id);
  if (!before) return;

  tx(() => {
    const now = nowIso();
    const prod = one<{ stock: number }>(
      `SELECT stock FROM produit WHERE id = ?`,
      before.produit_id
    );
    const stockAvant = prod?.stock ?? 0;
    const stockApres = stockAvant - before.quantite; // on annule l'entrée
    run(
      `UPDATE produit SET stock = ?, maj_le = ? WHERE id = ?`,
      stockApres,
      now,
      before.produit_id
    );
    run(
      `INSERT INTO mouvement_stock
         (produit_id, type, quantite, stock_avant, stock_apres, raison, ref_id, user_id, date)
       VALUES (?,?,?,?,?,?,?,?,?)`,
      before.produit_id,
      "correction",
      -before.quantite,
      stockAvant,
      stockApres,
      "Suppression d'achat",
      id,
      before.user_id,
      now
    );
    run(`DELETE FROM achat WHERE id = ?`, id);
    journaliser({
      userId,
      action: "suppression",
      entite: "achat",
      details: "Achat supprimé",
      refId: id,
    });
  });
}
