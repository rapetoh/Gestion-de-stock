// Parseur d'import de produits — souple et standard, partagé par l'aperçu (client) et l'action.
//
// Idéal : une 1re ligne d'EN-TÊTE qui nomme les colonnes (Nom, Prix de vente, Stock, Catégorie…)
// dans N'IMPORTE QUEL ordre, avec des synonymes courants. Les colonnes inconnues sont ignorées,
// seul « Nom » est requis. Sans en-tête reconnu, on retombe sur un ordre par défaut (rétrocompat).
// Une cellule vide reste « non fournie » (undefined), jamais 0.
import { parseCFA } from "./money";

export type ImportRow = {
  nom: string;
  prixAchat?: number;
  frais?: number;
  prixVente?: number;
  stock?: number;
  seuilStock?: number;
  categorie?: string | null;
};

export type Champ =
  | "nom"
  | "prixAchat"
  | "frais"
  | "prixVente"
  | "stock"
  | "seuilStock"
  | "categorie";

export type ImportResult = {
  rows: ImportRow[];
  colonnes: string[]; // libellés des colonnes reconnues (mode en-tête), pour l'aperçu
  avecEntete: boolean;
};

export const LABELS: Record<Champ, string> = {
  nom: "Nom",
  prixAchat: "Prix d'achat",
  frais: "Frais",
  prixVente: "Prix de vente",
  stock: "Stock",
  seuilStock: "Seuil",
  categorie: "Catégorie",
};

// Ordre par défaut quand il n'y a pas d'en-tête (rétrocompatible avec l'ancien format).
const ORDRE_DEFAUT: Champ[] = [
  "nom",
  "prixAchat",
  "frais",
  "prixVente",
  "stock",
  "seuilStock",
  "categorie",
];

// Synonymes d'en-tête. Ordre des CHAMPS important : on teste « achat/frais » avant « prix »,
// et « seuil » avant « stock », pour éviter les collisions (« prix d'achat », « seuil de stock »).
const SYNONYMES: [Champ, string[]][] = [
  ["nom", ["nom", "produit", "article", "designation", "libelle", "name", "item"]],
  ["prixAchat", ["prix d achat", "prix achat", "achat", "cout de revient", "prix de revient", "cout", "cost", "purchase"]],
  ["frais", ["frais", "transport", "livraison", "shipping"]],
  ["prixVente", ["prix de vente", "prix vente", "prix unitaire", "vente", "prix", "price", "sell"]],
  ["seuilStock", ["seuil de stock", "seuil", "alerte", "minimum", "reorder"]],
  ["stock", ["stock", "quantite", "qte", "quantity", "qty", "disponible"]],
  ["categorie", ["categorie", "category", "rayon", "famille", "groupe", "type"]],
];

function normalise(s: string): string {
  return (s ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // enlève les accents (marques combinantes)
    .replace(/[^a-z0-9 ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function champPourEntete(entete: string): Champ | null {
  const h = normalise(entete);
  if (!h) return null;
  for (const [champ, syns] of SYNONYMES) {
    for (const s of syns) {
      const n = normalise(s);
      if (h === n || h.includes(n)) return champ;
    }
  }
  return null;
}

function maybeNum(cell?: string): number | undefined {
  const s = (cell ?? "").trim();
  return s === "" ? undefined : parseCFA(s);
}

function detecterDelim(ligne: string): string {
  return ligne.includes("\t") ? "\t" : ligne.includes(";") ? ";" : ",";
}

export function parseProduitsTexte(texte: string): ImportResult {
  const lignes = (texte ?? "")
    .replace(/^﻿/, "") // BOM éventuel (Excel / notre propre export)
    .split(/\r?\n/)
    .filter((l) => l.trim() !== "");
  if (!lignes.length) return { rows: [], colonnes: [], avecEntete: false };

  const delim = detecterDelim(lignes[0]);
  const cellsDe = (l: string) => l.split(delim).map((c) => c.trim());

  // La 1re ligne est-elle un en-tête ? (≥2 colonnes reconnues, ou la 1re = Nom + au moins une autre)
  const mapEntete = cellsDe(lignes[0]).map(champPourEntete);
  const nbReconnus = mapEntete.filter(Boolean).length;
  const avecEntete = nbReconnus >= 2 || (mapEntete[0] === "nom" && nbReconnus >= 1);

  const mapping: (Champ | null)[] = avecEntete ? mapEntete : ORDRE_DEFAUT;
  const donnees = avecEntete ? lignes.slice(1) : lignes;

  const rows: ImportRow[] = [];
  for (const ligne of donnees) {
    const cols = cellsDe(ligne);
    const row: ImportRow = { nom: "" };
    mapping.forEach((champ, i) => {
      if (!champ) return;
      const val = cols[i];
      if (champ === "nom") row.nom = (val ?? "").trim();
      else if (champ === "categorie") row.categorie = (val ?? "").trim() || undefined;
      else row[champ] = maybeNum(val);
    });
    const nom = row.nom.trim();
    if (!nom) continue;
    // En mode sans en-tête, ignore une ligne d'en-tête restée par mégarde.
    if (!avecEntete && /^(nom|produit)$/i.test(nom)) continue;
    rows.push(row);
  }

  const colonnes = avecEntete
    ? (mapEntete.filter(Boolean) as Champ[]).map((c) => LABELS[c])
    : [];

  return { rows, colonnes, avecEntete };
}
