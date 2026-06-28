import { describe, it, expect } from "vitest";
import { parseCFA, formatCFA } from "../lib/money";

const NS = String.fromCharCode(0x202f); // espace fine insécable (séparateur de milliers)

describe("parseCFA", () => {
  it("lit les formats courants en FCFA", () => {
    expect(parseCFA("1 500")).toBe(1500);
    expect(parseCFA("1.500")).toBe(1500);
    expect(parseCFA("1500 F")).toBe(1500);
    expect(parseCFA(1500)).toBe(1500);
  });

  it("ne renvoie JAMAIS un nombre négatif (prix/quantité/montant)", () => {
    expect(parseCFA("-100")).toBe(0);
    expect(parseCFA(-100)).toBe(0);
  });

  it("renvoie 0 sur une saisie illisible ou vide", () => {
    expect(parseCFA("abc")).toBe(0);
    expect(parseCFA("")).toBe(0);
  });
});

describe("formatCFA", () => {
  it("formate avec séparateur de milliers et suffixe F", () => {
    expect(formatCFA(150000)).toBe(`150${NS}000 F`);
  });
});
