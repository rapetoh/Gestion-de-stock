import { describe, it, expect } from "vitest";
import { bornesJour, bornesMois } from "../lib/periodes";

describe("périodes (bornes Lomé / UTC)", () => {
  it("bornes d'un jour = minuit UTC à minuit UTC suivant (demi-ouvert)", () => {
    const { debut, fin } = bornesJour("2026-06-27");
    expect(debut).toBe("2026-06-27T00:00:00.000Z");
    expect(fin).toBe("2026-06-28T00:00:00.000Z");
  });

  it("bornes d'un mois = 1er à 1er du mois suivant", () => {
    expect(bornesMois(2026, 6)).toEqual({
      debut: "2026-06-01T00:00:00.000Z",
      fin: "2026-07-01T00:00:00.000Z",
    });
    // Passage d'année.
    expect(bornesMois(2026, 12)).toEqual({
      debut: "2026-12-01T00:00:00.000Z",
      fin: "2027-01-01T00:00:00.000Z",
    });
  });

  it("une vente à 23:30 (heure de Lomé) tombe le bon jour", () => {
    // 23:30 Lomé = 23:30 UTC (UTC+0). Doit appartenir au 27, pas au 28.
    const venteIso = "2026-06-27T23:30:00.000Z";
    const j27 = bornesJour("2026-06-27");
    const j28 = bornesJour("2026-06-28");
    expect(venteIso >= j27.debut && venteIso < j27.fin).toBe(true);
    expect(venteIso >= j28.debut && venteIso < j28.fin).toBe(false);
  });
});
