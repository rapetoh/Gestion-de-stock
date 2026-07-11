import { describe, it, expect, beforeEach } from "vitest";
import { resetDb } from "./helpers";
import {
  parseProduitsTexte,
  parseGrille,
  autoMapper,
  devinerEnteteIndex,
  construireRows,
  parseNombreImport,
} from "../lib/import";
import { importerProduits, listProduits, createProduit, getProduit, chercherProduits } from "../lib/repo/produits";
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

describe("fichier Excel réel et brouillon (titre, colonne Code/XX, doublons, Qté=1)", () => {
  // Reproduit la vraie feuille : 1re ligne = titre fusionné ; vraie colonne « Produit » en 2e ;
  // colonnes en double (Total en stock, Qté pour code, Prix d'achat/vente vides) qui pourraient
  // écraser les bonnes valeurs si on n'était pas prudent.
  const fichier = [
    "Gestion des produit version courte;;;;;;;;;;;;;;;",
    "Code;Produit;En stock;Prix d'achat unit.;Prix Unit.;Transport;TVA;CHK_COMPOSE;Total en stock;DCI;Prix Unit. Don;Code à bars;Qté. pour Code à bars;Peremption Alerte (Jours);Prix d'achat;Prix de vente",
    "XX;GRAINE DE COURGE;0;600;850;0;;0;0;;0;;1;;0;0",
    "XX;GINO RIZ 900 G;14;700;950;0;;0;14;;0;3760100682434;1;;0;0",
  ].join("\n");

  it("saute le titre, lit le Nom dans « Produit » (jamais « XX » de la colonne Code)", () => {
    const res = parseProduitsTexte(fichier);
    expect(res.avecEntete).toBe(true);
    expect(res.rows).toHaveLength(2);
    expect(res.rows.map((r) => r.nom)).toEqual(["GRAINE DE COURGE", "GINO RIZ 900 G"]);
  });

  it("prend les VRAIES colonnes (pas les doublons vides ni la Qté=1)", () => {
    const [a, b] = parseProduitsTexte(fichier).rows;
    // achat ← « Prix d'achat unit. » (600/700), PAS la colonne « Prix d'achat » vide (0)
    expect(a).toMatchObject({ prixAchat: 600, prixVente: 850, stock: 0 });
    // stock ← « En stock » (14), PAS « Qté. pour Code à bars » (=1)
    expect(b).toMatchObject({ prixAchat: 700, prixVente: 950, stock: 14 });
  });

  it("montre la correspondance résolue pour l'aperçu", () => {
    const res = parseProduitsTexte(fichier);
    const par = Object.fromEntries(res.mapping.map((m) => [m.champ, m.source]));
    expect(par.nom).toBe("Produit");
    expect(par.stock).toBe("En stock");
    expect(par.prixAchat).toBe("Prix d'achat unit.");
    expect(par.prixVente).toBe("Prix Unit.");
    // « Péremption Alerte (Jours) » ne doit PAS être pris pour le seuil de stock.
    expect(par.seuilStock).toBeUndefined();
  });

  it("importe sans créer de produit « XX » ni « Code »", () => {
    const res = importerProduits(parseProduitsTexte(fichier).rows, null);
    expect(res.crees).toBe(2);
    const noms = listProduits().map((p) => p.nom).sort();
    expect(noms).toEqual(["GINO RIZ 900 G", "GRAINE DE COURGE"]);
  });
});

describe("primitives génériques (mapping explicite, ré-utilisable pour tout fichier)", () => {
  it("parseGrille découpe en cellules et auto-détecte le séparateur", () => {
    const g = parseGrille("a;b;c\n1;2;3");
    expect(g.delim).toBe(";");
    expect(g.lignes).toEqual([["a", "b", "c"], ["1", "2", "3"]]);
  });

  it("autoMapper n'attribue chaque champ qu'une fois (1re colonne gagnante)", () => {
    const m = autoMapper(["Produit", "En stock", "Total en stock", "Prix de vente", "Prix"]);
    // stock seulement sur « En stock » ; prixVente seulement sur « Prix de vente »
    expect(m).toEqual(["nom", "stock", null, "prixVente", null]);
  });

  it("devinerEnteteIndex saute une ligne de titre au-dessus du vrai en-tête", () => {
    const { lignes } = parseGrille("Titre;;;\nNom;Stock;Prix de vente\nA;5;700");
    expect(devinerEnteteIndex(lignes)).toBe(1);
  });

  it("construireRows respecte un mapping imposé par l'utilisateur", () => {
    const { lignes } = parseGrille("ignore;le nom;le prix\nzzz;Savon;750");
    const rows = construireRows(lignes, 0, [null, "nom", "prixVente"]);
    expect(rows).toEqual([{ nom: "Savon", prixVente: 750 }]);
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

describe("le fichier réel de l'ancien logiciel (07-11-2026)", () => {
  const ENTETE =
    "Code,Produit,En stock,Prix d'achat unit.,Prix Unit.,Transport,TVA,CHK_COMPOSE,Total en stock,DCI,Prix Unit. Don,Code à bars,Qté. pour Code à bars,Peremption Alerte (Jours),Prix d'achat,Prix de vente";

  it("mapping : « Code à bars » = code-barres, « Code » (XX/ELECTRO…) ignoré, bons prix/stock", () => {
    const { lignes } = parseGrille(ENTETE);
    const m = autoMapper(lignes[0]);
    expect(m[0]).toBeNull(); // Code (fourre-tout) — ignoré
    expect(m[1]).toBe("nom"); // Produit
    expect(m[2]).toBe("stock"); // En stock
    expect(m[3]).toBe("prixAchat"); // Prix d'achat unit.
    expect(m[4]).toBe("prixVente"); // Prix Unit.
    expect(m[5]).toBe("frais"); // Transport
    expect(m[8]).toBeNull(); // Total en stock (stock déjà pris)
    expect(m[11]).toBe("codeBarre"); // Code à bars — le VRAI code
    expect(m[13]).toBeNull(); // Peremption Alerte
    expect(m[14]).toBeNull(); // Prix d'achat (doublon vide)
    expect(m[15]).toBeNull(); // Prix de vente (doublon vide)
  });

  it("lignes réelles : prix flottants arrondis, guillemets+virgule respectés, lignes sans nom sautées", () => {
    const texte = [
      ENTETE,
      "01,,,0,0,0,,,,,0,,,,0,0", // ligne de section — sautée
      "XXXX,EVER PACK PAPIER ALLUMINIUM  25SQ.FT,0,700,999.9997,0,,0,0,,0,6033000160072,1,,0,0",
      'XX,"APTA COLOR FIXATEUR DE COULEUR 1,5 L ",0,1785,2300,,,0,0,,0,3250391150250,1,,0,0',
      "MENAGE,EVER PACK ASSIETTES JETABLES PETITS 50 PCS,5,1600,2133.3328,0,,,5,,0,,1,,0,0",
      ",,,0,0,0,0,,5,,0,,,,1600,2133.3328", // ligne de lot — sautée
      "xx,JASMINE RICE USA JAUNE 11.34 KG ,1,16000,18227.856,0,,0,1,,0,,1,,0,0",
    ].join("\n");
    const { lignes } = parseGrille(texte);
    expect(devinerEnteteIndex(lignes)).toBe(0);
    const rows = construireRows(lignes, 0, autoMapper(lignes[0]));
    expect(rows).toHaveLength(4); // sections et lignes de lot disparues

    const [alu, apta, assiettes, riz] = rows;
    expect(alu).toMatchObject({ prixAchat: 700, prixVente: 1000, stock: 0, codeBarre: "6033000160072" });
    expect(apta.nom).toBe("APTA COLOR FIXATEUR DE COULEUR 1,5 L"); // virgule gardée dans le nom
    expect(apta).toMatchObject({ prixAchat: 1785, prixVente: 2300, codeBarre: "3250391150250" });
    expect(assiettes).toMatchObject({ prixVente: 2133, stock: 5 });
    expect(riz).toMatchObject({ prixAchat: 16000, prixVente: 18228, stock: 1 });
    expect(riz.codeBarre).toBeUndefined(); // cellule vide = pas de code
  });

  it("parseNombreImport : décimales arrondies, « 1.500 » à la française = 1500", () => {
    expect(parseNombreImport("999.9997")).toBe(1000);
    expect(parseNombreImport("449.9999")).toBe(450);
    expect(parseNombreImport("2133.3328")).toBe(2133);
    expect(parseNombreImport("1745.454")).toBe(1745);
    expect(parseNombreImport("1.500")).toBe(1500); // milliers à la française
    expect(parseNombreImport("1.234.567")).toBe(1234567);
    expect(parseNombreImport("1 799,9996")).toBe(1800);
    expect(parseNombreImport("750")).toBe(750);
  });
});

describe("code-barres (optionnel, jamais requis)", () => {
  it("autoMapper reconnaît une colonne code-barres — testée AVANT nom (« Code produit » ≠ nom)", () => {
    expect(autoMapper(["Code-barres", "Produit", "Prix"])).toEqual([
      "codeBarre",
      "nom",
      "prixVente",
    ]);
    expect(autoMapper(["EAN", "Nom"])).toEqual(["codeBarre", "nom"]);
    expect(autoMapper(["Code produit", "Désignation"])).toEqual(["codeBarre", "nom"]);
  });

  it("construireRows garde le code en TEXTE (zéros de tête intacts)", () => {
    const { lignes } = parseGrille("Nom;Code-barres\nSavon;0012345");
    const rows = construireRows(lignes, 0, ["nom", "codeBarre"]);
    expect(rows).toEqual([{ nom: "Savon", codeBarre: "0012345" }]);
  });

  it("import : stocke le code ; les doublons (fichier ou base) sont laissés de côté sans faire échouer", () => {
    importerProduits(
      parse("Nom;Code-barres\nSavon;111\nEau;111\nLait;222"),
      null
    );
    const parCode = (c: string) => chercherProduits(c, 5);
    expect(parCode("111").map((p) => p.nom)).toEqual(["Savon"]); // 1er gagnant, Eau sans code
    expect(parCode("222").map((p) => p.nom)).toEqual(["Lait"]);

    // Ré-import : un code déjà pris par un AUTRE produit n'écrase rien et ne plante pas.
    const res = importerProduits(parse("Nom;Code-barres\nDraps;222"), null);
    expect(res.crees).toBe(1);
    expect(parCode("222").map((p) => p.nom)).toEqual(["Lait"]);
  });

  it("scan à la caisse : la recherche trouve par code exact (pas seulement par nom)", () => {
    importerProduits(parse("Nom;Code-barres;Prix de vente\nDéodorant;61234567;1500"), null);
    const hits = chercherProduits("61234567", 15);
    expect(hits).toHaveLength(1);
    expect(hits[0].nom).toBe("Déodorant");
  });
});
