// Repository produits — accès données via les helpers de lib/db uniquement.
import { all, one, run, nowIso } from "../db";

export type Produit = {
  id: number;
  nom: string;
  categorie: string | null;
  prix_achat: number; // prix d'achat unitaire pur (hors frais)
  frais: number; // frais de transport unitaire
  prix_vente: number;
  stock: number;
  seuil_stock: number;
  code_barre: string | null;
  actif: number;
  cree_le: string;
  maj_le: string;
};

export function listProduits(search?: string): Produit[] {
  const s = (search ?? "").trim();
  if (s) {
    return all<Produit>(
      `SELECT * FROM produit WHERE actif = 1 AND nom LIKE ? ORDER BY nom`,
      `%${s}%`
    );
  }
  return all<Produit>(`SELECT * FROM produit WHERE actif = 1 ORDER BY nom`);
}

export function getProduit(id: number): Produit | undefined {
  return one<Produit>(`SELECT * FROM produit WHERE id = ?`, id);
}

export function getProduitParNom(nom: string): Produit | undefined {
  return one<Produit>(
    `SELECT * FROM produit WHERE actif = 1 AND nom = ? COLLATE NOCASE LIMIT 1`,
    nom.trim()
  );
}

export type ProduitInput = {
  nom: string;
  categorie?: string | null;
  prixAchat?: number;
  frais?: number;
  prixVente?: number;
  stock?: number;
  seuilStock?: number;
  codeBarre?: string | null;
};

export function createProduit(data: ProduitInput): number {
  const now = nowIso();
  const r = run(
    `INSERT INTO produit
       (nom, categorie, prix_achat, frais, prix_vente, stock, seuil_stock, code_barre, actif, cree_le, maj_le)
     VALUES (?,?,?,?,?,?,?,?,1,?,?)`,
    data.nom.trim(),
    data.categorie ?? null,
    data.prixAchat ?? 0,
    data.frais ?? 0,
    data.prixVente ?? 0,
    data.stock ?? 0,
    data.seuilStock ?? 0,
    data.codeBarre ?? null,
    now,
    now
  );
  return r.lastId;
}

export function updateProduit(id: number, data: ProduitInput): void {
  run(
    `UPDATE produit SET
       nom = ?, categorie = ?, prix_achat = ?, frais = ?, prix_vente = ?,
       stock = ?, seuil_stock = ?, code_barre = ?, maj_le = ?
     WHERE id = ?`,
    data.nom.trim(),
    data.categorie ?? null,
    data.prixAchat ?? 0,
    data.frais ?? 0,
    data.prixVente ?? 0,
    data.stock ?? 0,
    data.seuilStock ?? 0,
    data.codeBarre ?? null,
    nowIso(),
    id
  );
}

export function removeProduit(id: number): void {
  // Suppression douce : le produit reste pour l'historique des ventes/achats.
  run(`UPDATE produit SET actif = 0, maj_le = ? WHERE id = ?`, nowIso(), id);
}

export function produitsARecommander(): Produit[] {
  return all<Produit>(
    `SELECT * FROM produit
     WHERE actif = 1 AND stock <= seuil_stock
     ORDER BY (stock - seuil_stock) ASC, nom`
  );
}
