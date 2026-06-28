// Repository produits — accès données via les helpers de lib/db uniquement.
import { all, one, run, tx, nowIso } from "../db";
import { journaliser } from "./activite";
import type { ImportRow } from "../import";

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

// Normalise un nom : espaces multiples réduits à un seul, bords coupés. Évite les faux doublons
// « Eau de source » vs « Eau de  source » qui scinderaient le stock et fausseraient le contrôle.
export function normaliserNom(nom: string): string {
  return nom.replace(/\s+/g, " ").trim();
}

export function getProduitParNom(nom: string): Produit | undefined {
  return one<Produit>(
    `SELECT * FROM produit WHERE actif = 1 AND nom = ? COLLATE NOCASE LIMIT 1`,
    normaliserNom(nom)
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

export function createProduit(data: ProduitInput, userId?: number | null): number {
  const now = nowIso();
  const r = run(
    `INSERT INTO produit
       (nom, categorie, prix_achat, frais, prix_vente, stock, seuil_stock, code_barre, actif, cree_le, maj_le)
     VALUES (?,?,?,?,?,?,?,?,1,?,?)`,
    normaliserNom(data.nom),
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
  journaliser({
    userId,
    action: "creation",
    entite: "produit",
    details: `Produit créé : ${normaliserNom(data.nom)}`,
    refId: r.lastId,
  });
  return r.lastId;
}

export function updateProduit(
  id: number,
  data: ProduitInput,
  userId?: number | null
): void {
  run(
    `UPDATE produit SET
       nom = ?, categorie = ?, prix_achat = ?, frais = ?, prix_vente = ?,
       stock = ?, seuil_stock = ?, code_barre = ?, maj_le = ?
     WHERE id = ?`,
    normaliserNom(data.nom),
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
  journaliser({
    userId,
    action: "modification",
    entite: "produit",
    details: `Produit modifié : ${normaliserNom(data.nom)}`,
    refId: id,
  });
}

export function removeProduit(id: number, userId?: number | null): void {
  // Suppression douce : le produit reste pour l'historique des ventes/achats.
  const before = one<Produit>(`SELECT nom FROM produit WHERE id = ?`, id);
  run(`UPDATE produit SET actif = 0, maj_le = ? WHERE id = ?`, nowIso(), id);
  journaliser({
    userId,
    action: "suppression",
    entite: "produit",
    details: `Produit retiré${before ? ` : ${before.nom}` : ""}`,
    refId: id,
  });
}

// Import en masse : crée les nouveaux produits, met à jour ceux dont le nom existe déjà
// (régularisation), le tout dans une transaction. Une seule ligne de journal résume l'opération.
export function importerProduits(
  rows: ImportRow[],
  userId?: number | null
): { crees: number; maj: number; ignores: number } {
  return tx(() => {
    let crees = 0;
    let maj = 0;
    let ignores = 0;
    const now = nowIso();
    for (const r of rows) {
      const nom = normaliserNom(r.nom);
      if (!nom) continue;
      const existant = one<{ id: number }>(
        `SELECT id FROM produit WHERE actif = 1 AND nom = ? COLLATE NOCASE`,
        nom
      );

      if (existant) {
        // Produit existant : on ne met à jour QUE les colonnes réellement remplies.
        // Le stock n'est JAMAIS écrasé par l'import (il se gère via Achats/Ventes/Contrôle) —
        // une liste collée a un stock périmé dès qu'on la tape.
        const sets: string[] = [];
        const vals: unknown[] = [];
        if (r.categorie !== undefined) { sets.push("categorie = ?"); vals.push(r.categorie); }
        if (r.prixAchat !== undefined) { sets.push("prix_achat = ?"); vals.push(r.prixAchat); }
        if (r.frais !== undefined) { sets.push("frais = ?"); vals.push(r.frais); }
        if (r.prixVente !== undefined) { sets.push("prix_vente = ?"); vals.push(r.prixVente); }
        if (r.seuilStock !== undefined) { sets.push("seuil_stock = ?"); vals.push(r.seuilStock); }

        if (sets.length === 0) {
          ignores++; // rien de neuf à appliquer
          continue;
        }
        sets.push("maj_le = ?");
        vals.push(now);
        run(`UPDATE produit SET ${sets.join(", ")} WHERE id = ?`, ...vals, existant.id);
        maj++;
      } else {
        // Nouveau produit : le stock de l'import est le stock de départ (le comptage d'ouverture).
        run(
          `INSERT INTO produit
             (nom, categorie, prix_achat, frais, prix_vente, stock, seuil_stock, code_barre, actif, cree_le, maj_le)
           VALUES (?,?,?,?,?,?,?,?,1,?,?)`,
          nom,
          r.categorie ?? null,
          r.prixAchat ?? 0,
          r.frais ?? 0,
          r.prixVente ?? 0,
          r.stock ?? 0,
          r.seuilStock ?? 0,
          null,
          now,
          now
        );
        crees++;
      }
    }
    journaliser({
      userId,
      action: "creation",
      entite: "produit",
      details: `Import de produits : ${crees} créés, ${maj} mis à jour${ignores ? `, ${ignores} sans changement` : ""}`,
    });
    return { crees, maj, ignores };
  });
}

export function produitsARecommander(): Produit[] {
  return all<Produit>(
    `SELECT * FROM produit
     WHERE actif = 1 AND stock <= seuil_stock
     ORDER BY (stock - seuil_stock) ASC, nom`
  );
}
