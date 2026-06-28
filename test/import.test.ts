import { describe, it, expect, beforeEach } from "vitest";
import { resetDb } from "./helpers";
import { parseProduitsTexte } from "../lib/import";
import { importerProduits, listProduits, createProduit, getProduit } from "../lib/repo/produits";
import { listActivite } from "../lib/repo/activite";

beforeEach(resetDb);

describe("parseProduitsTexte", () => {
  it("lit les colonnes séparées par ;", () => {
    const [r] = parseProduitsTexte("Savon;450;30;750;50;5;Cosmétique");
    expect(r).toEqual({
      nom: "Savon",
      prixAchat: 450,
      frais: 30,
      prixVente: 750,
      stock: 50,
      seuilStock: 5,
      categorie: "Cosmétique",
    });
  });

  it("détecte la tabulation (copier depuis Excel)", () => {
    const [r] = parseProduitsTexte("Eau\t300\t0\t500\t100\t10\tEau");
    expect(r.nom).toBe("Eau");
    expect(r.prixVente).toBe(500);
    expect(r.stock).toBe(100);
  });

  it("ignore l'en-tête et les lignes vides", () => {
    const rows = parseProduitsTexte("Nom;Prix\n\nSavon;1;0;2;3\n");
    expect(rows).toHaveLength(1);
    expect(rows[0].nom).toBe("Savon");
  });

  it("une case vide reste 'non fournie' (undefined), pas 0", () => {
    const [r] = parseProduitsTexte("Bonbons");
    expect(r.nom).toBe("Bonbons");
    expect(r.prixVente).toBeUndefined();
    expect(r.stock).toBeUndefined();
    expect(r.categorie).toBeUndefined();

    const [r2] = parseProduitsTexte("Eau;;;120"); // seul le prix de vente est rempli
    expect(r2.prixAchat).toBeUndefined();
    expect(r2.prixVente).toBe(120);
    expect(r2.stock).toBeUndefined();
  });

  it("nettoie les nombres avec espaces", () => {
    const [r] = parseProduitsTexte("Carton;1 350;3 000;2 000;3;5");
    expect(r.prixAchat).toBe(1350);
    expect(r.frais).toBe(3000);
    expect(r.prixVente).toBe(2000);
  });
});

describe("importerProduits", () => {
  it("crée les nouveaux (stock de départ pris dans l'import)", () => {
    const res = importerProduits(parseProduitsTexte("Neuf;10;0;20;7;3;Divers"), null);
    expect(res).toEqual({ crees: 1, maj: 0, ignores: 0 });
    const p = listProduits()[0];
    expect(p).toMatchObject({ nom: "Neuf", prix_vente: 20, stock: 7 });
  });

  it("met à jour SEULEMENT les colonnes remplies d'un produit existant", () => {
    const id = createProduit({ nom: "Eau", prixAchat: 50, frais: 0, prixVente: 100, stock: 5, seuilStock: 3 });
    importerProduits(parseProduitsTexte("eau;;;120"), null); // seul le prix de vente
    const eau = getProduit(id)!;
    expect(eau.prix_vente).toBe(120); // mis à jour
    expect(eau.prix_achat).toBe(50); // inchangé
    expect(eau.seuil_stock).toBe(3); // inchangé
  });

  it("ne met JAMAIS à 0 ni n'écrase le stock d'un produit existant", () => {
    const id = createProduit({ nom: "Eau", prixAchat: 50, frais: 0, prixVente: 100, stock: 5 });
    // nom seul : rien à changer
    let res = importerProduits(parseProduitsTexte("Eau"), null);
    expect(res).toEqual({ crees: 0, maj: 0, ignores: 1 });
    expect(getProduit(id)!.stock).toBe(5);
    expect(getProduit(id)!.prix_vente).toBe(100);

    // même avec une colonne stock, le stock d'un produit existant n'est pas touché
    res = importerProduits(parseProduitsTexte("Eau;;;;999"), null);
    expect(getProduit(id)!.stock).toBe(5);
  });

  it("ne crée pas de doublon au ré-import et journalise un résumé", () => {
    importerProduits(parseProduitsTexte("A;1;0;2;3\nB;1;0;2;3"), null);
    importerProduits(parseProduitsTexte("A;1;0;9;3"), null);
    expect(listProduits()).toHaveLength(2);
    const resume = listActivite().filter((l) => l.details.startsWith("Import"));
    expect(resume.length).toBeGreaterThanOrEqual(1);
  });
});
