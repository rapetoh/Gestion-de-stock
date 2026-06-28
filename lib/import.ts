// Parseur pur (sans accès base) pour l'import en masse de produits.
// Partagé par l'aperçu côté client et l'action serveur, pour une seule logique de lecture.
import { parseCFA } from "./money";

// Un champ non rempli reste `undefined` (= « ne pas toucher »), à ne pas confondre avec 0.
export type ImportRow = {
  nom: string;
  prixAchat?: number;
  frais?: number;
  prixVente?: number;
  stock?: number;
  seuilStock?: number;
  categorie?: string | null;
};

// Cellule vide -> undefined ; sinon nombre nettoyé.
function maybeNum(cell?: string): number | undefined {
  const s = (cell ?? "").trim();
  return s === "" ? undefined : parseCFA(s);
}

// Une ligne = un produit. Colonnes, dans l'ordre :
//   Nom ; Prix d'achat ; Frais ; Prix de vente ; Stock ; Seuil ; Catégorie
// Séparateur détecté par ligne : tabulation (copier d'Excel), sinon « ; », sinon « , ».
// Une cellule laissée vide n'est PAS prise en compte (ni mise à 0).
export function parseProduitsTexte(texte: string): ImportRow[] {
  const rows: ImportRow[] = [];
  for (const brute of (texte ?? "").split(/\r?\n/)) {
    const ligne = brute.trim();
    if (!ligne) continue;

    const delim = ligne.includes("\t") ? "\t" : ligne.includes(";") ? ";" : ",";
    const cols = ligne.split(delim).map((c) => c.trim());

    const nom = cols[0] ?? "";
    if (!nom) continue;
    // Ignore une éventuelle ligne d'en-tête.
    if (/^(nom|produit)$/i.test(nom)) continue;

    rows.push({
      nom,
      prixAchat: maybeNum(cols[1]),
      frais: maybeNum(cols[2]),
      prixVente: maybeNum(cols[3]),
      stock: maybeNum(cols[4]),
      seuilStock: maybeNum(cols[5]),
      categorie: (cols[6] ?? "").trim() || undefined,
    });
  }
  return rows;
}
