import { describe, it, expect, beforeEach } from "vitest";
import { resetDb } from "./helpers";
import { run } from "../lib/db";
import { createProduit } from "../lib/repo/produits";
import { createVente } from "../lib/repo/ventes";
import { anneeMoisCourants } from "../lib/periodes";
import {
  caParJour,
  recetteMargeParMois,
  paiementsDuMois,
  topProduitsMois,
  valeurStock,
  produitsDormants,
  nbProduitsDormants,
} from "../lib/repo/stats";

beforeEach(resetDb);

function seedProduit(nom: string, prixVente: number, stock = 10, prixAchat = 0): number {
  return createProduit({ nom, prixAchat, prixVente, stock });
}

describe("statistiques : agrégats bornés", () => {
  it("caParJour renvoie une série CONTINUE (jours sans vente = 0)", () => {
    const pid = seedProduit("Eau", 500);
    createVente({ paiement: "especes", lignes: [{ produitId: pid, quantite: 2 }] });
    const points = caParJour(7);
    expect(points).toHaveLength(7); // 7 jours, pas seulement ceux avec des ventes
    expect(points[6].total).toBe(1000); // aujourd'hui, dernier point
    expect(points.slice(0, 6).every((p) => p.total === 0)).toBe(true);
  });

  it("paiementsDuMois : ordre FIXE espèces/tmoney/flooz/crédit, zéros compris", () => {
    const pid = seedProduit("Savon", 750);
    createVente({ paiement: "tmoney", lignes: [{ produitId: pid, quantite: 1 }] });
    createVente({ paiement: "tmoney", lignes: [{ produitId: pid, quantite: 2 }] });
    createVente({ paiement: "credit", lignes: [{ produitId: pid, quantite: 1 }] });
    const { year, month } = anneeMoisCourants();
    const rep = paiementsDuMois(year, month);
    expect(rep.map((r) => r.paiement)).toEqual(["especes", "tmoney", "flooz", "credit"]);
    expect(rep[1]).toMatchObject({ total: 2250, nb: 2 }); // tmoney
    expect(rep[0]).toMatchObject({ total: 0, nb: 0 }); // espèces : zéro mais présent
    expect(rep[3].total).toBe(750); // crédit
  });

  it("recetteMargeParMois : 12 mois continus, le mois courant porte les ventes", () => {
    const pid = seedProduit("Lait", 500, 20, 350);
    createVente({ paiement: "especes", lignes: [{ produitId: pid, quantite: 4 }] });
    const serie = recetteMargeParMois(12);
    expect(serie).toHaveLength(12);
    const dernier = serie[11];
    expect(dernier.recette).toBe(2000);
    expect(dernier.marge).toBe(600); // (500-350) × 4
    expect(serie.slice(0, 11).every((p) => p.recette === 0)).toBe(true);
  });

  it("topProduitsMois classe par MARGE, pas par quantité", () => {
    const gros = seedProduit("Drap", 15000, 10, 9000); // marge 6000 l'unité
    const petit = seedProduit("Bonbon", 25, 100, 20); // marge 5 l'unité
    createVente({ paiement: "especes", lignes: [{ produitId: petit, quantite: 50 }] }); // marge 250
    createVente({ paiement: "especes", lignes: [{ produitId: gros, quantite: 1 }] }); // marge 6000
    const { year, month } = anneeMoisCourants();
    const top = topProduitsMois(year, month, 5);
    expect(top[0].nom).toBe("Drap");
    expect(top[0].marge).toBe(6000);
  });

  it("valeurStock : coût (achat+frais) et valeur de revente", () => {
    createProduit({ nom: "A", prixAchat: 100, frais: 10, prixVente: 200, stock: 5 });
    createProduit({ nom: "B", prixAchat: 50, frais: 0, prixVente: 100, stock: 0 }); // stock 0 : ignoré
    const v = valeurStock();
    expect(v.cout).toBe(550); // 5 × 110
    expect(v.vente).toBe(1000);
    expect(v.unites).toBe(5);
    expect(v.nbProduits).toBe(1);
  });

  it("produitsDormants : en stock sans vente récente, classés par valeur immobilisée", () => {
    const dormant = seedProduit("Whisky", 6000, 4, 4500); // 18 000 immobilisés, jamais vendu
    const actif = seedProduit("Eau", 500, 10, 300);
    createVente({ paiement: "especes", lignes: [{ produitId: actif, quantite: 1 }] });
    void dormant;
    const d = produitsDormants(30, 5);
    expect(d.map((x) => x.nom)).toEqual(["Whisky"]);
    expect(d[0].immobilise).toBe(18000);
    expect(d[0].derniereVente).toBeNull();
    expect(nbProduitsDormants(30)).toBe(1);

    // Une vieille vente (40 jours) ne « réveille » pas le produit.
    run(
      "INSERT INTO vente (date, paiement, total) VALUES (?,?,?)",
      new Date(Date.now() - 40 * 86400000).toISOString(),
      "especes",
      6000
    );
    expect(nbProduitsDormants(30)).toBe(1);
  });
});
