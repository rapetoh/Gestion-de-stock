// Parseur pur (sans accès base) pour l'import en masse de produits.
// Partagé par l'aperçu côté client et l'action serveur, pour une seule logique de lecture.
import { parseCFA } from "./money";

export type ImportRow = {
  nom: string;
  prixAchat: number;
  frais: number;
  prixVente: number;
  stock: number;
  seuilStock: number;
  categorie: string | null;
};

// Une ligne = un produit. Colonnes, dans l'ordre :
//   Nom ; Prix d'achat ; Frais ; Prix de vente ; Stock ; Seuil ; Catégorie
// Séparateur détecté par ligne : tabulation (copier d'Excel), sinon « ; », sinon « , ».
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
      prixAchat: parseCFA(cols[1] ?? "0"),
      frais: parseCFA(cols[2] ?? "0"),
      prixVente: parseCFA(cols[3] ?? "0"),
      stock: parseCFA(cols[4] ?? "0"),
      seuilStock: parseCFA(cols[5] ?? "0"),
      categorie: (cols[6] ?? "").trim() || null,
    });
  }
  return rows;
}
