import { describe, it, expect, beforeEach } from "vitest";
import { resetDb } from "./helpers";
import { all } from "../lib/db";
import {
  createProduit,
  removeProduit,
  getProduit,
  getProduitParNom,
  normaliserNom,
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
});
