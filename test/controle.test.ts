import { describe, it, expect, beforeEach } from "vitest";
import { resetDb, stockOf, lastMvt, countMvts } from "./helpers";
import { createProduit } from "../lib/repo/produits";
import {
  enregistrerControle,
  listControles,
  getControle,
} from "../lib/repo/controle";

beforeEach(resetDb);

describe("contrôle de stock — anti-vol", () => {
  it("chiffre le manque, corrige le stock et garde l'écart en historique", () => {
    // coût de revient unitaire = 100 + 20 = 120
    const savon = createProduit({ nom: "Savon", prixAchat: 100, frais: 20, prixVente: 200, stock: 10 });
    // coût de revient unitaire = 200
    const lait = createProduit({ nom: "Lait", prixAchat: 200, frais: 0, prixVente: 350, stock: 5 });

    const cid = enregistrerControle({
      note: "contrôle test",
      lignes: [
        { produitId: savon, compte: 6 }, // manque 4 → −480
        { produitId: lait, compte: 7 }, // +2 en trop → +400
      ],
    });

    // Le stock devient ce qui a été compté.
    expect(stockOf(savon)).toBe(6);
    expect(stockOf(lait)).toBe(7);

    // Résumé chiffré.
    const resume = listControles()[0];
    expect(resume).toMatchObject({ nb_produits: 2, manque: 480, surplus: 400 });

    // L'écart reste dans l'historique.
    const detail = getControle(cid)!;
    const ligneSavon = detail.lignes.find((l) => l.produit_id === savon)!;
    expect(ligneSavon).toMatchObject({
      theorique: 10,
      compte: 6,
      ecart: -4,
      valeur_ecart: -480,
      nom: "Savon",
    });

    // Trace d'un mouvement de type 'controle'.
    expect(lastMvt(savon)).toMatchObject({
      type: "controle",
      quantite: -4,
      raison: "Contrôle de stock",
    });
  });

  it("ne touche pas au stock quand le compte tombe juste", () => {
    const eau = createProduit({ nom: "Eau", prixAchat: 50, frais: 0, prixVente: 100, stock: 8 });
    enregistrerControle({ lignes: [{ produitId: eau, compte: 8 }] });
    expect(stockOf(eau)).toBe(8);
    expect(countMvts(eau)).toBe(0); // aucun mouvement écrit
  });

  it("refuse un contrôle sans aucun produit compté", () => {
    expect(() => enregistrerControle({ lignes: [] })).toThrow();
  });
});
