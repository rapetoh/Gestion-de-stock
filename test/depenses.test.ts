import { describe, it, expect, beforeEach } from "vitest";
import { resetDb } from "./helpers";
import {
  createDepense,
  updateDepense,
  deleteDepense,
  depensesDuMois,
  totalDepensesMois,
} from "../lib/repo/depenses";
import { createProduit } from "../lib/repo/produits";
import { createVente } from "../lib/repo/ventes";
import { parProduit } from "../lib/repo/benefices";

beforeEach(resetDb);

describe("dépenses", () => {
  it("totalise les dépenses d'un mois et ignore les autres mois", () => {
    createDepense({ libelle: "Loyer", montant: 30000, categorie: "Loyer", date: "2026-06-05" });
    createDepense({ libelle: "Transport", montant: 2000, categorie: "Transport", date: "2026-06-20" });
    createDepense({ libelle: "Loyer mai", montant: 30000, categorie: "Loyer", date: "2026-05-05" });

    expect(totalDepensesMois(2026, 6)).toBe(32000);
    expect(totalDepensesMois(2026, 5)).toBe(30000);
    expect(depensesDuMois(2026, 6)).toHaveLength(2);
  });

  it("modifier et supprimer une dépense met le total à jour", () => {
    const id = createDepense({ libelle: "Électricité", montant: 5000, date: "2026-06-10" });
    updateDepense(id, { montant: 8000 });
    expect(totalDepensesMois(2026, 6)).toBe(8000);
    deleteDepense(id);
    expect(totalDepensesMois(2026, 6)).toBe(0);
  });

  it("garde le flag 'revient chaque mois'", () => {
    createDepense({ libelle: "Loyer", montant: 30000, recurrente: true, date: "2026-06-01" });
    expect(depensesDuMois(2026, 6)[0].recurrente).toBe(1);
  });

  it("une dépense récurrente compte chaque mois suivant, sans la ressaisir", () => {
    // Saisie une seule fois en juin.
    createDepense({ libelle: "Loyer", montant: 30000, recurrente: true, date: "2026-06-01" });
    createDepense({ libelle: "Salaire", montant: 25000, recurrente: true, date: "2026-06-01" });
    // Une ponctuelle de juin qui NE doit PAS suivre en juillet.
    createDepense({ libelle: "Transport", montant: 2000, date: "2026-06-20" });

    // Juin : loyer + salaire + transport.
    expect(totalDepensesMois(2026, 6)).toBe(57000);
    // Juillet : loyer + salaire reportés ; transport non.
    expect(totalDepensesMois(2026, 7)).toBe(55000);
    expect(depensesDuMois(2026, 7).map((d) => d.libelle).sort()).toEqual(["Loyer", "Salaire"]);
    // Décembre : toujours reportés.
    expect(totalDepensesMois(2026, 12)).toBe(55000);
    // Avant le mois de départ (mai) : rien.
    expect(totalDepensesMois(2026, 5)).toBe(0);
  });

  it("supprimer une dépense récurrente l'arrête pour les mois suivants", () => {
    const id = createDepense({ libelle: "Internet", montant: 10000, recurrente: true, date: "2026-06-01" });
    expect(totalDepensesMois(2026, 8)).toBe(10000);
    deleteDepense(id);
    expect(totalDepensesMois(2026, 8)).toBe(0);
  });

  it("la marge regroupe par produit même après un renommage", async () => {
    const { updateProduit } = await import("../lib/repo/produits");
    const now = new Date();
    const y = now.getFullYear();
    const m = now.getMonth() + 1;

    const pid = createProduit({ nom: "Eau", prixAchat: 100, frais: 0, prixVente: 150, stock: 10 });
    createVente({ paiement: "especes", lignes: [{ produitId: pid, quantite: 1 }] }); // figé "Eau"
    updateProduit(pid, { nom: "Eau minérale", prixVente: 150 }); // renommage
    createVente({ paiement: "especes", lignes: [{ produitId: pid, quantite: 1 }] }); // figé "Eau minérale"

    const b = parProduit(y, m);
    // Une seule ligne produit (groupée par id), pas deux à cause du renommage.
    expect(b.lignes).toHaveLength(1);
    expect(b.lignes[0].qteVendue).toBe(2);
    expect(b.lignes[0].nom).toBe("Eau minérale"); // nom actuel
  });

  it("marge réelle = marge sur marchandise − dépenses du mois", () => {
    const now = new Date();
    const y = now.getFullYear();
    const m = now.getMonth() + 1;

    const pid = createProduit({ nom: "Eau", prixAchat: 100, frais: 0, prixVente: 150, stock: 10 });
    createVente({ paiement: "especes", lignes: [{ produitId: pid, quantite: 2 }] }); // marge 2×50 = 100
    createDepense({ libelle: "Transport", montant: 40 }); // aujourd'hui → mois courant

    const margeMarchandise = parProduit(y, m).totaux.marge;
    const margeReelle = margeMarchandise - totalDepensesMois(y, m);

    expect(margeMarchandise).toBe(100);
    expect(margeReelle).toBe(60);
  });
});
