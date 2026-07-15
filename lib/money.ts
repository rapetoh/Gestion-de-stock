// Francs CFA: integer amounts, no decimals. Display with thin spaces as thousands sep.

export function formatCFA(n: number): string {
  const v = Math.round(n || 0);
  const sign = v < 0 ? "−" : "";
  const digits = Math.abs(v)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, " "); // narrow no-break space
  return `${sign}${digits} F`;
}

// Parse user input like "1 500", "1.500", "1500 F" -> 1500.
// Jamais négatif : un prix, une quantité ou un montant ne l'est pas (sinon on perdrait du stock/argent
// en silence). Une saisie négative ou illisible devient 0 — visible, jamais un nombre faux caché.
export function parseCFA(input: string | number): number {
  const n =
    typeof input === "number"
      ? Math.round(input)
      : parseInt((input || "").toString().replace(/[^\d-]/g, ""), 10);
  return Number.isFinite(n) && n > 0 ? n : 0;
}

// Cost of goods (coût de revient) per unit when receiving a purchase:
// (prix d'achat unitaire) + (frais de transport du lot répartis sur la quantité).
// Les frais de transport sont STOCKÉS pour le lot entier (contrat de lib/repo/achats.ts).
// Mais au marché on les connaît parfois « par unité » : cette fonction ramène la saisie
// au lot — la conversion se fait à la frontière du formulaire, jamais dans le stockage.
export function fraisPourLeLot(saisie: number, mode: string, quantite: number): number {
  return mode === "unite" ? saisie * Math.max(quantite, 0) : saisie;
}

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
