// Repository bénéfices — la marge produit par produit sur un mois donné.
import { all } from "../db";

export type LigneBenefice = {
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

function bornesDuMois(year: number, month: number): { debut: string; fin: string } {
  // month : 1–12
  const debut = new Date(year, month - 1, 1, 0, 0, 0, 0);
  const fin = new Date(year, month, 1, 0, 0, 0, 0);
  return { debut: debut.toISOString(), fin: fin.toISOString() };
}

export function parProduit(year: number, month: number): Benefices {
  const { debut, fin } = bornesDuMois(year, month);

  const rows = all<LigneBenefice>(
    `SELECT lv.nom_produit AS nom,
            SUM(lv.quantite) AS qteVendue,
            SUM(lv.cout_unitaire * lv.quantite) AS achete,
            SUM(lv.frais_unitaire * lv.quantite) AS frais,
            SUM(lv.total) AS vendu,
            SUM((lv.prix_unitaire - lv.cout_unitaire - lv.frais_unitaire) * lv.quantite) AS marge
       FROM ligne_vente lv
       JOIN vente v ON v.id = lv.vente_id
      WHERE v.date >= ? AND v.date < ?
      GROUP BY lv.nom_produit
      ORDER BY marge DESC`,
    debut,
    fin
  );

  const totaux = rows.reduce<LigneBenefice>(
    (acc, r) => ({
      nom: "Total",
      qteVendue: acc.qteVendue + r.qteVendue,
      achete: acc.achete + r.achete,
      frais: acc.frais + r.frais,
      vendu: acc.vendu + r.vendu,
      marge: acc.marge + r.marge,
    }),
    { nom: "Total", qteVendue: 0, achete: 0, frais: 0, vendu: 0, marge: 0 }
  );

  return { lignes: rows, totaux };
}
