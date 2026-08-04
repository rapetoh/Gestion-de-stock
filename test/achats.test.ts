import { describe, it, expect, beforeEach } from "vitest";
import { resetDb, stockOf, lastMvt } from "./helpers";
import { one } from "../lib/db";
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

describe("date réelle de l'achat et complément produit", () => {
  it("un achat antidaté porte le jour choisi, et la date se corrige", async () => {
    const { createProduit } = await import("../lib/repo/produits");
    const pid = createProduit({ nom: "Sardine date", prixVente: 1400 });
    const aid = createAchat({ produitId: pid, quantite: 2, prixAchat: 1000, frais: 0, prixVente: 1400, jour: "2026-07-10" });
    const a1 = one<{ date: string }>("SELECT date FROM achat WHERE id = ?", aid)!;
    expect(a1.date).toBe("2026-07-10T12:00:00.000Z");
    updateAchat(aid, { jour: "2026-07-12" });
    const a2 = one<{ date: string }>("SELECT date FROM achat WHERE id = ?", aid)!;
    expect(a2.date).toBe("2026-07-12T12:00:00.000Z");
    // sans jour fourni, la date existante ne bouge pas
    updateAchat(aid, { quantite: 3 });
    expect(one<{ date: string }>("SELECT date FROM achat WHERE id = ?", aid)!.date).toBe("2026-07-12T12:00:00.000Z");
  });

  it("completerProduitDepuisAchat : catégorie suit, le code ne vole ni n'écrase jamais", async () => {
    const { createProduit, completerProduitDepuisAchat, getProduit } = await import("../lib/repo/produits");
    const autre = createProduit({ nom: "Autre", prixVente: 100, codeBarre: "111" });
    const pid = createProduit({ nom: "Nouveau", prixVente: 200 });
    completerProduitDepuisAchat(pid, "Épicerie", "111"); // code déjà pris par « Autre »
    expect(getProduit(pid)!.categorie).toBe("Épicerie");
    expect(getProduit(pid)!.code_barre).toBeNull(); // pas volé
    completerProduitDepuisAchat(pid, null, "222");
    expect(getProduit(pid)!.code_barre).toBe("222"); // posé car vide et libre
    completerProduitDepuisAchat(pid, null, "333");
    expect(getProduit(pid)!.code_barre).toBe("222"); // jamais écrasé
    expect(getProduit(autre)!.code_barre).toBe("111");
  });
});
