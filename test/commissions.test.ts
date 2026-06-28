import { describe, it, expect, beforeEach } from "vitest";
import { resetDb } from "./helpers";
import {
  createCommission,
  updateCommission,
  deleteCommission,
  commissionsDuMois,
  totalCommissionsMois,
} from "../lib/repo/commissions";

beforeEach(resetDb);

describe("commissions Mobile Money", () => {
  it("totalise les commissions d'un mois et ignore les autres", () => {
    createCommission({ libelle: "TMoney", montant: 750, canal: "TMoney", date: "2026-06-05" });
    createCommission({ libelle: "Flooz", montant: 500, canal: "Flooz", date: "2026-06-20" });
    createCommission({ libelle: "TMoney mai", montant: 900, canal: "TMoney", date: "2026-05-05" });

    expect(totalCommissionsMois(2026, 6)).toBe(1250);
    expect(totalCommissionsMois(2026, 5)).toBe(900);
    expect(commissionsDuMois(2026, 6)).toHaveLength(2);
  });

  it("modifier et supprimer met le total à jour", () => {
    const id = createCommission({ libelle: "Airtime", montant: 300, date: "2026-06-10" });
    updateCommission(id, { montant: 1200 });
    expect(totalCommissionsMois(2026, 6)).toBe(1200);
    deleteCommission(id);
    expect(totalCommissionsMois(2026, 6)).toBe(0);
  });
});
