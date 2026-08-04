import { describe, it, expect, beforeEach } from "vitest";
import { resetDb } from "./helpers";
import { one } from "../lib/db";
import { createProduit, getProduit } from "../lib/repo/produits";
import { createDepense } from "../lib/repo/depenses";
import {
  nomsCategories,
  listCategoriesGerees,
  ajouterCategorie,
  renommerCategorie,
  supprimerCategorie,
} from "../lib/repo/categories";

beforeEach(resetDb);

describe("catégories de produits", () => {
  it("les catégories par défaut (sa propre nomenclature) sont là dès le départ", () => {
    const noms = nomsCategories();
    expect(noms).toContain("Épicerie");
    expect(noms).toContain("Boissons alcoolisées");
    expect(noms).toContain("Hygiène");
    expect(noms.length).toBeGreaterThanOrEqual(14);
  });

  it("une catégorie tapée sur un produit rejoint la liste toute seule", () => {
    createProduit({ nom: "Desperados 440ml", categorie: "BIERRE", prixVente: 1000 });
    expect(nomsCategories()).toContain("BIERRE");
  });

  it("renommer répercute sur tous les produits (fusion de doublons comprise)", () => {
    createProduit({ nom: "Despe", categorie: "BIERRE", prixVente: 1000 });
    const p2 = createProduit({ nom: "Castel", categorie: "bierre", prixVente: 600 });
    const bierre = listCategoriesGerees().find((c) => c.nom === "BIERRE")!;
    const touches = renommerCategorie(bierre.id, "Boissons alcoolisées");
    expect(touches).toBe(2); // les deux casse-différentes
    expect(getProduit(p2)!.categorie).toBe("Boissons alcoolisées");
    // fusion : plus de BIERRE, pas de doublon « Boissons alcoolisées »
    const noms = nomsCategories().filter((n) => n.toLowerCase() === "boissons alcoolisées");
    expect(noms).toHaveLength(1);
    expect(nomsCategories()).not.toContain("BIERRE");
  });

  it("supprimer vide l'étiquette des produits mais ne touche JAMAIS les dépenses", () => {
    const pid = createProduit({ nom: "Savon", categorie: "Hygiène", prixVente: 700 });
    createDepense({ libelle: "Savon pour la boutique", montant: 500, categorie: "Hygiène", recurrente: false });
    const hyg = listCategoriesGerees().find((c) => c.nom === "Hygiène")!;
    const touches = supprimerCategorie(hyg.id);
    expect(touches).toBe(1);
    expect(getProduit(pid)!.categorie).toBeNull();
    // la dépense garde SA catégorie : deux mondes séparés
    const dep = one<{ categorie: string }>("SELECT categorie FROM depense LIMIT 1");
    expect(dep!.categorie).toBe("Hygiène");
  });

  it("ajouter est idempotent (pas de doublons, même en changeant la casse)", () => {
    ajouterCategorie("Boissons chaudes");
    ajouterCategorie("boissons chaudes");
    const noms = nomsCategories().filter((n) => n.toLowerCase() === "boissons chaudes");
    expect(noms).toHaveLength(1);
  });
});
