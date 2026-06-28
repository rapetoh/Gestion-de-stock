// Exports CSV lisibles dans Excel — pour consulter/partager, en plus de la sauvegarde .db.
import { all } from "../db";

// Échappe une cellule CSV (guillemets, virgules, retours ligne).
function cell(v: unknown): string {
  const s = v == null ? "" : String(v);
  return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function toCsv(headers: string[], rows: unknown[][]): string {
  const lignes = [headers.join(";"), ...rows.map((r) => r.map(cell).join(";"))];
  return lignes.join("\r\n");
}

export function produitsCsv(): string {
  const rows = all<{
    nom: string;
    categorie: string | null;
    prix_achat: number;
    frais: number;
    prix_vente: number;
    stock: number;
    seuil_stock: number;
    code_barre: string | null;
  }>(
    `SELECT nom, categorie, prix_achat, frais, prix_vente, stock, seuil_stock, code_barre
       FROM produit WHERE actif = 1 ORDER BY nom`
  );
  return toCsv(
    ["Produit", "Catégorie", "Prix d'achat", "Frais", "Prix de vente", "Stock", "Seuil", "Code-barres"],
    rows.map((p) => [
      p.nom,
      p.categorie,
      p.prix_achat,
      p.frais,
      p.prix_vente,
      p.stock,
      p.seuil_stock,
      p.code_barre,
    ])
  );
}

export function ventesCsv(): string {
  const rows = all<{
    date: string;
    paiement: string;
    nom_produit: string;
    quantite: number;
    prix_unitaire: number;
    total: number;
  }>(
    `SELECT v.date AS date, v.paiement AS paiement,
            lv.nom_produit AS nom_produit, lv.quantite AS quantite,
            lv.prix_unitaire AS prix_unitaire, lv.total AS total
       FROM ligne_vente lv JOIN vente v ON v.id = lv.vente_id
      ORDER BY v.date DESC, lv.id`
  );
  return toCsv(
    ["Date", "Paiement", "Produit", "Quantité", "Prix unitaire", "Total"],
    rows.map((r) => [r.date, r.paiement, r.nom_produit, r.quantite, r.prix_unitaire, r.total])
  );
}

export function depensesCsv(): string {
  const rows = all<{ date: string; libelle: string; categorie: string | null; montant: number }>(
    `SELECT date, libelle, categorie, montant FROM depense ORDER BY date DESC`
  );
  return toCsv(
    ["Date", "Libellé", "Catégorie", "Montant"],
    rows.map((d) => [d.date, d.libelle, d.categorie, d.montant])
  );
}

export function commissionsCsv(): string {
  const rows = all<{ date: string; libelle: string; canal: string | null; montant: number }>(
    `SELECT date, libelle, canal, montant FROM commission ORDER BY date DESC`
  );
  return toCsv(
    ["Date", "Libellé", "Canal", "Montant"],
    rows.map((c) => [c.date, c.libelle, c.canal, c.montant])
  );
}
