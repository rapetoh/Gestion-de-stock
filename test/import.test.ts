import { describe, it, expect, beforeEach } from "vitest";
import { resetDb } from "./helpers";
import { parseProduitsTexte } from "../lib/import";
import { importerProduits, listProduits, createProduit } from "../lib/repo/produits";
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

  it("accepte un nom seul (le reste à 0)", () => {
    const [r] = parseProduitsTexte("Bonbons");
    expect(r.nom).toBe("Bonbons");
    expect(r.prixVente).toBe(0);
    expect(r.categorie).toBeNull();
  });

  it("nettoie les nombres avec espaces", () => {
    const [r] = parseProduitsTexte("Carton;1 350;3 000;2 000;3;5");
    expect(r.prixAchat).toBe(1350);
    expect(r.frais).toBe(3000);
    expect(r.prixVente).toBe(2000);
  });
});

describe("importerProduits", () => {
  it("crée les nouveaux et met à jour les existants (par nom, insensible à la casse)", () => {
    createProduit({ nom: "Eau", prixAchat: 50, frais: 0, prixVente: 100, stock: 1 });
    const rows = parseProduitsTexte("eau;60;0;120;20;5;Eau\nSavon;450;30;750;50;5;Cosmétique");
    const res = importerProduits(rows, null);
    expect(res).toEqual({ crees: 1, maj: 1 });

    const tous = listProduits();
    expect(tous).toHaveLength(2);
    const eau = tous.find((p) => p.nom.toLowerCase() === "eau")!;
    expect(eau.prix_vente).toBe(120);
    expect(eau.stock).toBe(20);
  });

  it("ne crée pas de doublon au ré-import et journalise un résumé", () => {
    importerProduits(parseProduitsTexte("A;1;0;2;3\nB;1;0;2;3"), null);
    importerProduits(parseProduitsTexte("A;1;0;9;3"), null);
    expect(listProduits()).toHaveLength(2);
    const resume = listActivite().filter((l) => l.details.startsWith("Import"));
    expect(resume.length).toBeGreaterThanOrEqual(1);
  });
});
