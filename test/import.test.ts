import { describe, it, expect, beforeEach } from "vitest";
import { resetDb } from "./helpers";
import { parseProduitsTexte } from "../lib/import";
import { importerProduits, listProduits, createProduit, getProduit } from "../lib/repo/produits";
import { listActivite } from "../lib/repo/activite";

beforeEach(resetDb);

const parse = (t: string) => parseProduitsTexte(t).rows;

describe("parseProduitsTexte — en-tête souple", () => {
  it("mappe les colonnes par leur nom, dans n'importe quel ordre", () => {
    const res = parseProduitsTexte("Nom;Stock;Prix de vente\nSavon;50;750");
    expect(res.avecEntete).toBe(true);
    expect(res.colonnes).toEqual(["Nom", "Stock", "Prix de vente"]);
    expect(res.rows[0]).toMatchObject({ nom: "Savon", stock: 50, prixVente: 750 });
    expect(res.rows[0].prixAchat).toBeUndefined();
  });

  it("reconnaît synonymes, accents et casse dans l'en-tête", () => {
    const [r] = parse("PRODUIT;Quantité;Catégorie\nEau;100;Boisson");
    expect(r).toMatchObject({ nom: "Eau", stock: 100, categorie: "Boisson" });
  });

  it("accepte un sous-ensemble de colonnes (seul le nom requis)", () => {
    const [r] = parse("Nom;Prix de vente\nA;500");
    expect(r).toMatchObject({ nom: "A", prixVente: 500 });
    expect(r.stock).toBeUndefined();
  });

  it("détecte la tabulation dans l'en-tête (copier d'Excel)", () => {
    const [r] = parse("Nom\tPrix de vente\nEau\t500");
    expect(r).toMatchObject({ nom: "Eau", prixVente: 500 });
  });

  it("sans en-tête, lit dans l'ordre par défaut (rétrocompatible)", () => {
    const res = parseProduitsTexte("Savon;450;30;750;50;5;Cosmétique");
    expect(res.avecEntete).toBe(false);
    expect(res.rows[0]).toEqual({
      nom: "Savon",
      prixAchat: 450,
      frais: 30,
      prixVente: 750,
      stock: 50,
      seuilStock: 5,
      categorie: "Cosmétique",
    });
  });

  it("une case vide reste 'non fournie' (undefined), pas 0", () => {
    const [r] = parse("Nom;Prix de vente;Stock\nBonbons;;");
    expect(r.prixVente).toBeUndefined();
    expect(r.stock).toBeUndefined();
  });

  it("nettoie les nombres avec espaces", () => {
    const [r] = parse("Nom;Prix de vente\nCarton;2 000");
    expect(r.prixVente).toBe(2000);
  });
});

describe("importerProduits", () => {
  it("crée les nouveaux (stock de départ pris dans l'import)", () => {
    const res = importerProduits(parse("Nom;Prix de vente;Stock\nNeuf;20;7"), null);
    expect(res).toEqual({ crees: 1, maj: 0, ignores: 0 });
    expect(listProduits()[0]).toMatchObject({ nom: "Neuf", prix_vente: 20, stock: 7 });
  });

  it("met à jour SEULEMENT les colonnes remplies d'un produit existant", () => {
    const id = createProduit({ nom: "Eau", prixAchat: 50, frais: 0, prixVente: 100, stock: 5, seuilStock: 3 });
    importerProduits(parse("Nom;Prix de vente\neau;120"), null);
    const eau = getProduit(id)!;
    expect(eau.prix_vente).toBe(120);
    expect(eau.prix_achat).toBe(50);
    expect(eau.seuil_stock).toBe(3);
  });

  it("ne met JAMAIS à 0 ni n'écrase le stock d'un produit existant", () => {
    const id = createProduit({ nom: "Eau", prixAchat: 50, frais: 0, prixVente: 100, stock: 5 });
    let res = importerProduits(parse("Nom\nEau"), null);
    expect(res).toEqual({ crees: 0, maj: 0, ignores: 1 });
    expect(getProduit(id)!.stock).toBe(5);

    res = importerProduits(parse("Nom;Stock\nEau;999"), null);
    expect(getProduit(id)!.stock).toBe(5); // stock existant jamais touché par l'import
  });

  it("ne crée pas de doublon au ré-import et journalise un résumé", () => {
    importerProduits(parse("Nom;Prix de vente\nA;2\nB;2"), null);
    importerProduits(parse("Nom;Prix de vente\nA;9"), null);
    expect(listProduits()).toHaveLength(2);
    const resume = listActivite().filter((l) => l.details.startsWith("Import"));
    expect(resume.length).toBeGreaterThanOrEqual(1);
  });
});
