// Repository statistiques : données agrégées pour le tableau de bord,
// la page Statistiques et le rapport mensuel. Tout est borné et groupé en SQL :
// aucune fonction ici ne charge une liste non bornée en mémoire.
import { all, one } from "../db";
import { nbProduitsARecommander } from "./produits";
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

  return {
    ventesDuJour: venteJour?.total ?? 0,
    nbVentesDuJour: venteJour?.nb ?? 0,
    margeDuMois: marge?.marge ?? 0,
    nbARecommander: nbProduitsARecommander(),
    topProduits: top,
  };
}

// ── Statistiques : agrégats pour la page Statistiques et le rapport mensuel ──

// Chiffre d'affaires jour par jour, N derniers jours, zéros compris : un graphique
// a besoin d'un axe de temps continu, pas seulement des jours où il y a eu des ventes.
export type PointJour = { jour: string; total: number };
export function caParJour(nbJours = 30): PointJour[] {
  const aujourdHui = bornesJour();
  const debut = new Date(new Date(aujourdHui.debut).getTime() - (nbJours - 1) * 86400000);
  const rows = all<{ j: string; total: number }>(
    `SELECT substr(date, 1, 10) AS j, COALESCE(SUM(total), 0) AS total
       FROM vente WHERE date >= ? AND date < ?
      GROUP BY j`,
    debut.toISOString(),
    aujourdHui.fin
  );
  const parJour = new Map(rows.map((r) => [r.j, r.total]));
  const out: PointJour[] = [];
  for (let k = 0; k < nbJours; k++) {
    const j = new Date(debut.getTime() + k * 86400000).toISOString().slice(0, 10);
    out.push({ jour: j, total: parJour.get(j) ?? 0 });
  }
  return out;
}

// Recette et marge marchandise, mois par mois (les N derniers, mois vides compris).
export type PointMois = { annee: number; mois: number; recette: number; marge: number };
export function recetteMargeParMois(nbMois = 12): PointMois[] {
  const { year, month } = anneeMoisCourants();
  const premier = new Date(Date.UTC(year, month - nbMois, 1));
  const rows = all<{ m: string; recette: number; marge: number }>(
    `SELECT substr(v.date, 1, 7) AS m,
            COALESCE(SUM(lv.total), 0) AS recette,
            COALESCE(SUM((lv.prix_unitaire - lv.cout_unitaire - lv.frais_unitaire) * lv.quantite), 0) AS marge
       FROM ligne_vente lv
       JOIN vente v ON v.id = lv.vente_id
      WHERE v.date >= ?
      GROUP BY m`,
    premier.toISOString()
  );
  const parMois = new Map(rows.map((r) => [r.m, r]));
  const out: PointMois[] = [];
  for (let k = nbMois - 1; k >= 0; k--) {
    const d = new Date(Date.UTC(year, month - 1 - k, 1));
    const cle = d.toISOString().slice(0, 7);
    const r = parMois.get(cle);
    out.push({
      annee: d.getUTCFullYear(),
      mois: d.getUTCMonth() + 1,
      recette: r?.recette ?? 0,
      marge: r?.marge ?? 0,
    });
  }
  return out;
}

// Répartition des paiements d'un mois, dans un ORDRE FIXE (une couleur par moyen
// de paiement dans les graphiques : l'ordre ne doit jamais bouger).
export const PAIEMENTS_ORDRE = ["especes", "tmoney", "flooz", "credit"] as const;
export type RepartitionPaiement = { paiement: string; total: number; nb: number };
export function paiementsDuMois(year: number, month: number): RepartitionPaiement[] {
  const { debut, fin } = bornesMois(year, month);
  const rows = all<RepartitionPaiement>(
    `SELECT paiement, COALESCE(SUM(total), 0) AS total, COUNT(*) AS nb
       FROM vente WHERE date >= ? AND date < ?
      GROUP BY paiement`,
    debut,
    fin
  );
  const parPaiement = new Map(rows.map((r) => [r.paiement, r]));
  return PAIEMENTS_ORDRE.map(
    (p) => parPaiement.get(p) ?? { paiement: p, total: 0, nb: 0 }
  );
}

// Les produits qui rapportent le plus (par marge) sur un mois.
export function topProduitsMois(year: number, month: number, limit = 8): TopProduit[] {
  const { debut, fin } = bornesMois(year, month);
  return all<TopProduit>(
    `SELECT COALESCE(p.nom, lv.nom_produit) AS nom,
            SUM(lv.quantite) AS qte,
            SUM(lv.total) AS recette,
            SUM((lv.prix_unitaire - lv.cout_unitaire - lv.frais_unitaire) * lv.quantite) AS marge
       FROM ligne_vente lv
       JOIN vente v ON v.id = lv.vente_id
       LEFT JOIN produit p ON p.id = lv.produit_id
      WHERE v.date >= ? AND v.date < ?
      GROUP BY lv.produit_id, COALESCE(p.nom, lv.nom_produit)
      ORDER BY marge DESC
      LIMIT ?`,
    debut,
    fin,
    limit
  );
}

// Moyenne des ventes par jour de la semaine, sur une fenêtre d'exactement N semaines :
// chaque jour de semaine y apparaît N fois, la moyenne est donc honnête.
export type PointSemaine = { jourSemaine: number; moyenne: number }; // 0 = dimanche
export function ventesParJourSemaine(nbSemaines = 8): PointSemaine[] {
  const aujourdHui = bornesJour();
  const debut = new Date(
    new Date(aujourdHui.fin).getTime() - nbSemaines * 7 * 86400000
  );
  const rows = all<{ dow: string; total: number }>(
    `SELECT strftime('%w', date) AS dow, COALESCE(SUM(total), 0) AS total
       FROM vente WHERE date >= ? AND date < ?
      GROUP BY dow`,
    debut.toISOString(),
    aujourdHui.fin
  );
  const parJour = new Map(rows.map((r) => [Number(r.dow), r.total]));
  return Array.from({ length: 7 }, (_, d) => ({
    jourSemaine: d,
    moyenne: Math.round((parJour.get(d) ?? 0) / nbSemaines),
  }));
}

// Valeur du stock en rayon, au coût d'achat et au prix de vente.
export type ValeurStock = { cout: number; vente: number; unites: number; nbProduits: number };
export function valeurStock(): ValeurStock {
  return (
    one<ValeurStock>(
      `SELECT COALESCE(SUM(stock * (prix_achat + frais)), 0) AS cout,
              COALESCE(SUM(stock * prix_vente), 0) AS vente,
              COALESCE(SUM(stock), 0) AS unites,
              COUNT(*) AS nbProduits
         FROM produit WHERE actif = 1 AND stock > 0`
    ) ?? { cout: 0, vente: 0, unites: 0, nbProduits: 0 }
  );
}

// Produits dormants : en stock mais sans AUCUNE vente depuis N jours. C'est de
// l'argent qui dort sur l'étagère, classé par valeur immobilisée.
export type ProduitDormant = {
  id: number;
  nom: string;
  stock: number;
  immobilise: number;
  derniereVente: string | null;
};
export function produitsDormants(nbJours = 30, limit = 8): ProduitDormant[] {
  const depuis = new Date(Date.now() - nbJours * 86400000).toISOString();
  return all<ProduitDormant>(
    `SELECT p.id, p.nom, p.stock,
            p.stock * (p.prix_achat + p.frais) AS immobilise,
            (SELECT MAX(v.date) FROM ligne_vente lv JOIN vente v ON v.id = lv.vente_id
              WHERE lv.produit_id = p.id) AS derniereVente
       FROM produit p
      WHERE p.actif = 1 AND p.stock > 0
        AND NOT EXISTS (
          SELECT 1 FROM ligne_vente lv JOIN vente v ON v.id = lv.vente_id
           WHERE lv.produit_id = p.id AND v.date >= ?
        )
      ORDER BY immobilise DESC
      LIMIT ?`,
    depuis,
    limit
  );
}
export function nbProduitsDormants(nbJours = 30): number {
  const depuis = new Date(Date.now() - nbJours * 86400000).toISOString();
  return (
    one<{ n: number }>(
      `SELECT COUNT(*) AS n FROM produit p
        WHERE p.actif = 1 AND p.stock > 0
          AND NOT EXISTS (
            SELECT 1 FROM ligne_vente lv JOIN vente v ON v.id = lv.vente_id
             WHERE lv.produit_id = p.id AND v.date >= ?
          )`,
      depuis
    )?.n ?? 0
  );
}

// Manques constatés aux contrôles de stock, mois par mois (suivi anti-vol dans le temps).
export type PointManque = { annee: number; mois: number; manque: number };
export function manquesParMois(nbMois = 12): PointManque[] {
  const { year, month } = anneeMoisCourants();
  const premier = new Date(Date.UTC(year, month - nbMois, 1));
  const rows = all<{ m: string; manque: number }>(
    `SELECT substr(c.date, 1, 7) AS m,
            COALESCE(SUM(CASE WHEN lc.ecart < 0 THEN -lc.valeur_ecart ELSE 0 END), 0) AS manque
       FROM controle_stock c
       JOIN ligne_controle lc ON lc.controle_id = c.id
      WHERE c.date >= ?
      GROUP BY m`,
    premier.toISOString()
  );
  const parMois = new Map(rows.map((r) => [r.m, r.manque]));
  const out: PointManque[] = [];
  for (let k = nbMois - 1; k >= 0; k--) {
    const d = new Date(Date.UTC(year, month - 1 - k, 1));
    out.push({
      annee: d.getUTCFullYear(),
      mois: d.getUTCMonth() + 1,
      manque: parMois.get(d.toISOString().slice(0, 7)) ?? 0,
    });
  }
  return out;
}

// Dépenses d'un mois groupées par catégorie (mêmes règles que Bénéfices :
// les récurrentes comptent chaque mois après leur date de départ).
export type DepenseParCategorie = { categorie: string; total: number };
export function depensesParCategorieMois(year: number, month: number): DepenseParCategorie[] {
  const { debut, fin } = bornesMois(year, month);
  return all<DepenseParCategorie>(
    `SELECT COALESCE(NULLIF(categorie, ''), 'Autre') AS categorie,
            COALESCE(SUM(montant), 0) AS total
       FROM depense
      WHERE ((recurrente = 0 AND date >= ? AND date < ?) OR (recurrente = 1 AND date < ?))
      GROUP BY COALESCE(NULLIF(categorie, ''), 'Autre')
      ORDER BY total DESC`,
    debut,
    fin,
    fin
  );
}

// Contrôles de stock effectués dans un mois (pour le rapport mensuel).
export type ControleDuMois = {
  id: number;
  date: string;
  note: string | null;
  produits: number;
  manque: number;
  surplus: number;
};
export function controlesDuMois(year: number, month: number): ControleDuMois[] {
  const { debut, fin } = bornesMois(year, month);
  return all<ControleDuMois>(
    `SELECT c.id, c.date, c.note,
            COUNT(lc.id) AS produits,
            COALESCE(SUM(CASE WHEN lc.ecart < 0 THEN -lc.valeur_ecart ELSE 0 END), 0) AS manque,
            COALESCE(SUM(CASE WHEN lc.ecart > 0 THEN lc.valeur_ecart ELSE 0 END), 0) AS surplus
       FROM controle_stock c
       LEFT JOIN ligne_controle lc ON lc.controle_id = c.id
      WHERE c.date >= ? AND c.date < ?
      GROUP BY c.id
      ORDER BY c.date DESC`,
    debut,
    fin
  );
}
