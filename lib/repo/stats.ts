// Repository statistiques — données agrégées pour le tableau de bord.
import { all, one } from "../db";
import { produitsARecommander } from "./produits";
import { bornesJour, bornesMois, anneeMoisCourants } from "../periodes";

function bornesDuJour(): { debut: string; fin: string } {
  return bornesJour();
}

function bornesDuMois(): { debut: string; fin: string } {
  const { year, month } = anneeMoisCourants();
  return bornesMois(year, month);
}

export type TopProduit = {
  nom: string;
  qte: number;
  recette: number;
  marge: number;
};

export type Dashboard = {
  ventesDuJour: number;
  nbVentesDuJour: number;
  margeDuMois: number;
  nbARecommander: number;
  topProduits: TopProduit[];
};

export function dashboard(): Dashboard {
  const jour = bornesDuJour();
  const mois = bornesDuMois();

  const venteJour = one<{ total: number; nb: number }>(
    `SELECT COALESCE(SUM(total),0) AS total, COUNT(*) AS nb
       FROM vente WHERE date >= ? AND date < ?`,
    jour.debut,
    jour.fin
  );

  const marge = one<{ marge: number }>(
    `SELECT COALESCE(SUM((lv.prix_unitaire - lv.cout_unitaire - lv.frais_unitaire) * lv.quantite),0) AS marge
       FROM ligne_vente lv
       JOIN vente v ON v.id = lv.vente_id
      WHERE v.date >= ? AND v.date < ?`,
    mois.debut,
    mois.fin
  );

  const top = all<TopProduit>(
    `SELECT COALESCE(p.nom, lv.nom_produit) AS nom,
            SUM(lv.quantite) AS qte,
            SUM(lv.total) AS recette,
            SUM((lv.prix_unitaire - lv.cout_unitaire - lv.frais_unitaire) * lv.quantite) AS marge
       FROM ligne_vente lv
       JOIN vente v ON v.id = lv.vente_id
       LEFT JOIN produit p ON p.id = lv.produit_id
      WHERE v.date >= ? AND v.date < ?
      GROUP BY lv.produit_id, COALESCE(p.nom, lv.nom_produit)
      ORDER BY qte DESC
      LIMIT 5`,
    mois.debut,
    mois.fin
  );

  const aRecommander = produitsARecommander();

  return {
    ventesDuJour: venteJour?.total ?? 0,
    nbVentesDuJour: venteJour?.nb ?? 0,
    margeDuMois: marge?.marge ?? 0,
    nbARecommander: aRecommander.length,
    topProduits: top,
  };
}
