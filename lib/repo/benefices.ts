// Repository bénéfices — la marge produit par produit sur un mois donné.
import { all } from "../db";
import { bornesMois } from "../periodes";

export type LigneBenefice = {
  produitId: number | null;
  nom: string;
  qteVendue: number;
  achete: number; // coût marchandise (cout_unitaire * qté)
  frais: number; // frais de transport (frais_unitaire * qté)
  vendu: number; // recette (total des lignes)
  marge: number; // vendu − acheté − frais
};

export type Benefices = {
  lignes: LigneBenefice[];
  totaux: LigneBenefice;
};

export function parProduit(year: number, month: number): Benefices {
  const { debut, fin } = bornesMois(year, month);

  // Groupé par PRODUIT (id), pas par nom : renommer un produit ne le scinde plus en deux lignes.
  // Le nom affiché est le nom actuel du produit, sinon le nom figé au moment de la vente.
  const rows = all<LigneBenefice>(
    `SELECT lv.produit_id AS produitId,
            COALESCE(p.nom, lv.nom_produit) AS nom,
            SUM(lv.quantite) AS qteVendue,
            SUM(lv.cout_unitaire * lv.quantite) AS achete,
            SUM(lv.frais_unitaire * lv.quantite) AS frais,
            SUM(lv.total) AS vendu,
            SUM((lv.prix_unitaire - lv.cout_unitaire - lv.frais_unitaire) * lv.quantite) AS marge
       FROM ligne_vente lv
       JOIN vente v ON v.id = lv.vente_id
       LEFT JOIN produit p ON p.id = lv.produit_id
      WHERE v.date >= ? AND v.date < ?
      GROUP BY lv.produit_id, COALESCE(p.nom, lv.nom_produit)
      ORDER BY marge DESC`,
    debut,
    fin
  );

  const totaux = rows.reduce<LigneBenefice>(
    (acc, r) => ({
      produitId: null,
      nom: "Total",
      qteVendue: acc.qteVendue + r.qteVendue,
      achete: acc.achete + r.achete,
      frais: acc.frais + r.frais,
      vendu: acc.vendu + r.vendu,
      marge: acc.marge + r.marge,
    }),
    { produitId: null, nom: "Total", qteVendue: 0, achete: 0, frais: 0, vendu: 0, marge: 0 }
  );

  return { lignes: rows, totaux };
}
