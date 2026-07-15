// Repository produits : accès données via les helpers de lib/db uniquement.
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

// Liste filtrée + paginée, pour que les pages Produits/Stock tiennent la route à des milliers d'articles
// (on n'affiche qu'une page à la fois, filtrable par nom, catégorie et « stock bas »).
export type FiltreProduits = {
  recherche?: string;
  categorie?: string | null;
  basStock?: boolean; // stock <= seuil
  limit?: number;
  offset?: number;
};

export function listProduitsFiltres(
  f: FiltreProduits
): { produits: Produit[]; total: number } {
  const where: string[] = ["actif = 1"];
  const params: unknown[] = [];
  const s = (f.recherche ?? "").trim();
  if (s) {
    where.push("(nom LIKE ? OR code_barre = ?)");
    params.push(`%${s}%`, s);
  }
  if (f.categorie) {
    where.push("categorie = ?");
    params.push(f.categorie);
  }
  if (f.basStock) where.push("stock <= seuil_stock");
  const clause = where.join(" AND ");

  const total = one<{ n: number }>(`SELECT COUNT(*) AS n FROM produit WHERE ${clause}`, ...params)?.n ?? 0;
  const limit = f.limit ?? 50;
  const offset = f.offset ?? 0;
  const produits = all<Produit>(
    `SELECT * FROM produit WHERE ${clause} ORDER BY nom LIMIT ? OFFSET ?`,
    ...params,
    limit,
    offset
  );
  return { produits, total };
}

export function listCategories(): string[] {
  return all<{ categorie: string }>(
    `SELECT DISTINCT categorie FROM produit
      WHERE actif = 1 AND categorie IS NOT NULL AND categorie != ''
      ORDER BY categorie`
  ).map((r) => r.categorie);
}

// Recherche bornée pour l'autocomplétion (caisse, achats, contrôle) : on N'ENVOIE PAS tout le
// catalogue au téléphone : seulement les quelques produits qui correspondent à ce qu'elle tape.
export function chercherProduits(q: string, limit = 15): Produit[] {
  const s = q.trim();
  if (!s) return [];
  // Nom OU code-barres exact : une douchette « tape » le code puis Entrée :
  // le scan retrouve donc le produit dans la même case de recherche.
  return all<Produit>(
    `SELECT * FROM produit WHERE actif = 1 AND (nom LIKE ? OR code_barre = ?) ORDER BY nom LIMIT ?`,
    `%${s}%`,
    s,
    limit
  );
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
  const nom = normaliserNom(data.nom);

  // Anti-doublon : si un produit du même nom existe DÉJÀ (même supprimé), on réutilise sa ligne au lieu
  // d'en créer une seconde, sinon supprimer puis racheter « Eau » scinderait stock et historique en deux.
  // On ne touche pas au stock (géré par achats/ventes/contrôle) ; on réactive juste si besoin.
  const existant = one<Produit>(
    `SELECT * FROM produit WHERE nom = ? COLLATE NOCASE LIMIT 1`,
    nom
  );
  if (existant) {
    if (!existant.actif) {
      run(`UPDATE produit SET actif = 1, maj_le = ? WHERE id = ?`, now, existant.id);
      journaliser({
        userId,
        action: "modification",
        entite: "produit",
        details: `Produit réactivé : ${nom}`,
        refId: existant.id,
      });
    }
    return existant.id;
  }

  const r = run(
    `INSERT INTO produit
       (nom, categorie, prix_achat, frais, prix_vente, stock, seuil_stock, code_barre, actif, cree_le, maj_le)
     VALUES (?,?,?,?,?,?,?,?,1,?,?)`,
    nom,
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

    // code_barre est UNIQUE en base : un code en double (dans le fichier ou déjà pris par
    // un autre produit) est laissé de côté plutôt que de faire échouer tout l'import.
    const codesVus = new Set<string>();
    const codeLibre = (code: string | undefined, saufId?: number): string | null => {
      const c = (code ?? "").trim();
      if (!c) return null;
      if (codesVus.has(c)) return null;
      const autre = one<{ id: number }>(`SELECT id FROM produit WHERE code_barre = ?`, c);
      if (autre && autre.id !== saufId) return null;
      codesVus.add(c);
      return c;
    };

    for (const r of rows) {
      const nom = normaliserNom(r.nom);
      if (!nom) continue;
      const existant = one<{ id: number }>(
        `SELECT id FROM produit WHERE actif = 1 AND nom = ? COLLATE NOCASE`,
        nom
      );

      if (existant) {
        // Produit existant : on ne met à jour QUE les colonnes réellement remplies.
        // Le stock n'est JAMAIS écrasé par l'import (il se gère via Achats/Ventes/Contrôle) :
        // une liste collée a un stock périmé dès qu'on la tape.
        const sets: string[] = [];
        const vals: unknown[] = [];
        if (r.categorie !== undefined) { sets.push("categorie = ?"); vals.push(r.categorie); }
        if (r.prixAchat !== undefined) { sets.push("prix_achat = ?"); vals.push(r.prixAchat); }
        if (r.frais !== undefined) { sets.push("frais = ?"); vals.push(r.frais); }
        if (r.prixVente !== undefined) { sets.push("prix_vente = ?"); vals.push(r.prixVente); }
        if (r.seuilStock !== undefined) { sets.push("seuil_stock = ?"); vals.push(r.seuilStock); }
        if (r.codeBarre !== undefined) {
          const c = codeLibre(r.codeBarre, existant.id);
          // Un code en conflit n'écrase jamais l'existant ; un code valide s'applique.
          if (c) { sets.push("code_barre = ?"); vals.push(c); }
        }

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
          codeLibre(r.codeBarre),
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

// Le tableau de bord n'affiche que les plus urgents (les plus en dessous du seuil) ;
// le total réel vient de nbProduitsARecommander(). La liste complète vit sur
// Produits ?bas=1 (filtrée + paginée) : le tableau de bord ne doit jamais
// dérouler tout un catalogue.
export function produitsARecommander(limite = 8): Produit[] {
  return all<Produit>(
    `SELECT * FROM produit
     WHERE actif = 1 AND stock <= seuil_stock
     ORDER BY (stock - seuil_stock) ASC, nom
     LIMIT ?`,
    limite
  );
}

export function nbProduitsARecommander(): number {
  return (
    one<{ n: number }>(
      `SELECT COUNT(*) AS n FROM produit WHERE actif = 1 AND stock <= seuil_stock`
    )?.n ?? 0
  );
}

// Test « boutique vide » sans charger le catalogue.
export function nbProduitsActifs(): number {
  return one<{ n: number }>(`SELECT COUNT(*) AS n FROM produit WHERE actif = 1`)?.n ?? 0;
}
