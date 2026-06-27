import { describe, it, expect, beforeEach } from "vitest";
import { resetDb, stockOf, lastMvt } from "./helpers";
import { createProduit } from "../lib/repo/produits";
import { createAchat, updateAchat, deleteAchat } from "../lib/repo/achats";

beforeEach(resetDb);

function produit() {
  return createProduit({ nom: "Eau", prixAchat: 100, frais: 0, prixVente: 150, stock: 0 });
}

describe("achats — éditables, avec trace de stock", () => {
  it("un achat augmente le stock et trace un mouvement 'achat'", () => {
    const pid = produit();
    createAchat({ produitId: pid, quantite: 10, prixAchat: 100, frais: 0, prixVente: 150 });
    expect(stockOf(pid)).toBe(10);
    expect(lastMvt(pid)).toMatchObject({ type: "achat", quantite: 10 });
  });

  it("modifier la quantité réajuste le stock et trace une correction", () => {
    const pid = produit();
    const aid = createAchat({
      produitId: pid,
      quantite: 10,
      prixAchat: 100,
      frais: 0,
      prixVente: 150,
    });
    updateAchat(aid, { quantite: 6, prixAchat: 100, frais: 0, prixVente: 150 });
    expect(stockOf(pid)).toBe(6);
    expect(lastMvt(pid)).toMatchObject({
      type: "correction",
      quantite: -4,
      raison: "Correction d'achat",
    });
  });

  it("supprimer un achat annule l'entrée de stock", () => {
    const pid = produit();
    const aid = createAchat({
      produitId: pid,
      quantite: 10,
      prixAchat: 100,
      frais: 0,
      prixVente: 150,
    });
    deleteAchat(aid);
    expect(stockOf(pid)).toBe(0);
  });
});
