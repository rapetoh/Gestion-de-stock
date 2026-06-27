import { describe, it, expect, beforeEach } from "vitest";
import { resetDb, stockOf, lastMvt } from "./helpers";
import { one } from "../lib/db";
import { createProduit } from "../lib/repo/produits";
import { createVente, updateVente, deleteVente } from "../lib/repo/ventes";

beforeEach(resetDb);

function produit() {
  return createProduit({ nom: "Eau", prixAchat: 100, frais: 0, prixVente: 150, stock: 10 });
}
const ligneIdOf = (venteId: number) =>
  one<{ id: number }>("SELECT id FROM ligne_vente WHERE vente_id = ?", venteId)!.id;
const vente = (id: number) =>
  one<{ total: number; paiement: string }>("SELECT total, paiement FROM vente WHERE id = ?", id);

describe("ventes — sans caisse, éditables, avec trace", () => {
  it("une vente baisse le stock et calcule le total", () => {
    const pid = produit();
    const vid = createVente({ paiement: "especes", lignes: [{ produitId: pid, quantite: 2 }] });
    expect(stockOf(pid)).toBe(8);
    expect(vente(vid)).toEqual({ total: 300, paiement: "especes" });
    expect(lastMvt(pid)).toMatchObject({ type: "vente", quantite: -2 });
  });

  it("modifier la quantité vendue réajuste stock + total et trace une correction", () => {
    const pid = produit();
    const vid = createVente({ paiement: "especes", lignes: [{ produitId: pid, quantite: 2 }] });
    updateVente(vid, { paiement: "tmoney", lignes: [{ ligneId: ligneIdOf(vid), quantite: 5 }] });
    expect(stockOf(pid)).toBe(5); // 10 − 5
    expect(vente(vid)).toEqual({ total: 750, paiement: "tmoney" });
    expect(lastMvt(pid)).toMatchObject({
      type: "correction",
      quantite: -3,
      raison: "Correction de vente",
    });
  });

  it("mettre une ligne à 0 la retire, restaure le stock et supprime la vente vide", () => {
    const pid = produit();
    const vid = createVente({ paiement: "especes", lignes: [{ produitId: pid, quantite: 2 }] });
    updateVente(vid, { lignes: [{ ligneId: ligneIdOf(vid), quantite: 0 }] });
    expect(stockOf(pid)).toBe(10); // entièrement restauré
    expect(vente(vid)).toBeUndefined(); // vente vide supprimée
  });

  it("supprimer une vente remet le stock", () => {
    const pid = produit();
    const vid = createVente({ paiement: "especes", lignes: [{ produitId: pid, quantite: 4 }] });
    deleteVente(vid);
    expect(stockOf(pid)).toBe(10);
  });
});
