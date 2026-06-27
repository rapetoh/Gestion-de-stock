// Francs CFA: integer amounts, no decimals. Display with thin spaces as thousands sep.

export function formatCFA(n: number): string {
  const v = Math.round(n || 0);
  const sign = v < 0 ? "−" : "";
  const digits = Math.abs(v)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, " "); // narrow no-break space
  return `${sign}${digits} F`;
}

// Parse user input like "1 500", "1.500", "1500 F" -> 1500
export function parseCFA(input: string | number): number {
  if (typeof input === "number") return Math.round(input);
  const cleaned = (input || "").toString().replace(/[^\d-]/g, "");
  const n = parseInt(cleaned, 10);
  return Number.isFinite(n) ? n : 0;
}

// Cost of goods (coût de revient) per unit when receiving a purchase:
// (prix d'achat unitaire) + (frais de transport du lot répartis sur la quantité).
export function coutDeRevientUnitaire(
  prixAchatUnitaire: number,
  fraisLot: number,
  quantite: number
): number {
  if (quantite <= 0) return prixAchatUnitaire;
  return Math.round(prixAchatUnitaire + fraisLot / quantite);
}

// Marge unitaire = prix de vente − coût de revient unitaire.
export function margeUnitaire(prixVente: number, coutRevient: number): number {
  return Math.round(prixVente - coutRevient);
}
