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
