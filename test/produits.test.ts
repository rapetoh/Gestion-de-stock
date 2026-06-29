import { describe, it, expect, beforeEach } from "vitest";
import { resetDb } from "./helpers";
import { all } from "../lib/db";
import {
  createProduit,
  removeProduit,
  getProduit,
  getProduitParNom,
  normaliserNom,
  chercherProduits,
  listProduitsFiltres,
  listCategories,
} from "../lib/repo/produits";

beforeEach(resetDb);

describe("produits — anti-doublon", () => {
  it("supprimer puis recréer le même nom réutilise la ligne (pas de doublon, stock gardé)", () => {
    const id = createProduit({ nom: "Eau minérale", prixVente: 500, stock: 5 });
    removeProduit(id); // suppression douce (actif = 0)

    // getProduitParNom ne voit que l'actif → l'achat croirait devoir créer un nouveau produit…
    expect(getProduitParNom("Eau minérale")).toBeUndefined();

    // …mais createProduit réutilise et réactive la ligne existante, même casse/espaces différents.
    const id2 = createProduit({ nom: "eau  minérale" });
    expect(id2).toBe(id);

    const rows = all<{ id: number }>(
      "SELECT id FROM produit WHERE nom = ? COLLATE NOCASE",
      "Eau minérale"
    );
    expect(rows).toHaveLength(1); // une seule ligne, pas deux
    const p = getProduit(id)!;
    expect(p.actif).toBe(1); // réactivé
    expect(p.stock).toBe(5); // stock préservé (non remis à zéro)
  });

  it("recréer un produit actif existant renvoie le même id (jamais de doublon actif)", () => {
    const id = createProduit({ nom: "Savon", prixVente: 750, stock: 10 });
    const id2 = createProduit({ nom: "Savon", prixVente: 999 });
    expect(id2).toBe(id);
    expect(getProduit(id)!.stock).toBe(10); // pas écrasé
  });

  it("normaliserNom réduit les espaces", () => {
    expect(normaliserNom("  Eau   de  source ")).toBe("Eau de source");
  });

  it("chercherProduits renvoie les correspondances bornées (jamais tout le catalogue)", () => {
    for (let i = 0; i < 50; i++) createProduit({ nom: `Savon ${i}`, prixVente: 100 });
    createProduit({ nom: "Eau", prixVente: 200 });

    expect(chercherProduits("")).toHaveLength(0); // vide = rien (pas tout)
    expect(chercherProduits("eau")).toHaveLength(1);
    const savons = chercherProduits("savon", 15);
    expect(savons.length).toBe(15); // borné à la limite, pas les 50
  });

  it("listProduitsFiltres : catégorie, stock bas, et pagination", () => {
    createProduit({ nom: "Coca", categorie: "Boisson", stock: 1, seuilStock: 5 }); // bas
    createProduit({ nom: "Fanta", categorie: "Boisson", stock: 20, seuilStock: 5 });
    createProduit({ nom: "Savon", categorie: "Cosmétique", stock: 0, seuilStock: 3 }); // bas

    expect(listProduitsFiltres({ categorie: "Boisson" }).total).toBe(2);
    expect(listProduitsFiltres({ basStock: true }).total).toBe(2); // Coca + Savon
    expect(listProduitsFiltres({ categorie: "Boisson", basStock: true }).total).toBe(1); // Coca
    expect(listCategories()).toEqual(["Boisson", "Cosmétique"]);

    // Pagination : page de 2 sur 3 produits → 2 puis 1.
    expect(listProduitsFiltres({ limit: 2, offset: 0 }).produits).toHaveLength(2);
    expect(listProduitsFiltres({ limit: 2, offset: 2 }).produits).toHaveLength(1);
    expect(listProduitsFiltres({ limit: 2, offset: 0 }).total).toBe(3);
  });
});
