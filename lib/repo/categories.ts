// Repository catégories de PRODUITS : la liste de suggestions, gérée par la
// propriétaire. La vérité reste le texte `produit.categorie` ; ici on tient la
// liste propre : ajout, renommage (répercuté sur tous les produits concernés),
// suppression (les produits concernés perdent leur étiquette, jamais autre chose).
// Les catégories de DÉPENSES (Loyer, Salaires…) sont un domaine séparé : aucune
// fonction ici ne touche la table depense.
import { all, one, run, tx, nowIso } from "../db";
import { journaliser } from "./activite";

export type Categorie = { id: number; nom: string; nbProduits: number };

export function listCategoriesGerees(): Categorie[] {
  return all<Categorie>(
    `SELECT c.id, c.nom,
            (SELECT COUNT(*) FROM produit p
              WHERE p.actif = 1 AND p.categorie = c.nom COLLATE NOCASE) AS nbProduits
       FROM categorie c
      ORDER BY c.nom COLLATE NOCASE`
  );
}

// Simple liste de noms pour les suggestions des formulaires.
export function nomsCategories(): string[] {
  return all<{ nom: string }>(
    `SELECT nom FROM categorie ORDER BY nom COLLATE NOCASE`
  ).map((r) => r.nom);
}

// Toute catégorie tapée sur un produit rejoint la liste automatiquement :
// elle n'a jamais besoin de « créer » une catégorie avant de s'en servir.
export function adopterCategorie(nom: string | null | undefined): void {
  const n = (nom ?? "").trim();
  if (!n) return;
  run(`INSERT OR IGNORE INTO categorie (nom, cree_le) VALUES (?, ?)`, n, nowIso());
}

export function ajouterCategorie(nom: string, userId?: number | null): void {
  const n = nom.trim();
  if (!n) throw new Error("Nom de catégorie vide.");
  run(`INSERT OR IGNORE INTO categorie (nom, cree_le) VALUES (?, ?)`, n, nowIso());
  journaliser({
    userId,
    action: "creation",
    entite: "produit",
    details: `Catégorie ajoutée : ${n}`,
  });
}

// Renommer répercute sur TOUS les produits portant l'ancien nom (même écrit
// dans une autre casse). Retourne le nombre de produits mis à jour.
export function renommerCategorie(
  id: number,
  nouveauNom: string,
  userId?: number | null
): number {
  const n = nouveauNom.trim();
  if (!n) throw new Error("Nom de catégorie vide.");
  return tx(() => {
    const avant = one<{ nom: string }>(`SELECT nom FROM categorie WHERE id = ?`, id);
    if (!avant) return 0;
    // Fusion permise : renommer « BIERRE » en « Boissons alcoolisées » déjà
    // existante déplace les produits puis retire l'entrée en double.
    const existante = one<{ id: number }>(
      `SELECT id FROM categorie WHERE nom = ? COLLATE NOCASE AND id != ?`,
      n,
      id
    );
    const r = run(
      `UPDATE produit SET categorie = ?, maj_le = ? WHERE categorie = ? COLLATE NOCASE`,
      n,
      nowIso(),
      avant.nom
    );
    if (existante) {
      run(`DELETE FROM categorie WHERE id = ?`, id);
    } else {
      run(`UPDATE categorie SET nom = ? WHERE id = ?`, n, id);
    }
    journaliser({
      userId,
      action: "modification",
      entite: "produit",
      details: `Catégorie renommée : ${avant.nom} devient ${n} (${r.changes} produits)`,
    });
    return r.changes;
  });
}

// Supprimer retire la catégorie de la liste ET des produits qui la portaient
// (ils restent intacts, simplement sans étiquette). Retourne le nombre touché.
export function supprimerCategorie(id: number, userId?: number | null): number {
  return tx(() => {
    const avant = one<{ nom: string }>(`SELECT nom FROM categorie WHERE id = ?`, id);
    if (!avant) return 0;
    const r = run(
      `UPDATE produit SET categorie = NULL, maj_le = ? WHERE categorie = ? COLLATE NOCASE`,
      nowIso(),
      avant.nom
    );
    run(`DELETE FROM categorie WHERE id = ?`, id);
    journaliser({
      userId,
      action: "suppression",
      entite: "produit",
      details: `Catégorie supprimée : ${avant.nom} (${r.changes} produits sans catégorie)`,
    });
    return r.changes;
  });
}
