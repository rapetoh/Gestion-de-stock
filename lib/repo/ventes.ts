// Repository ventes — une vente baisse le stock dans une transaction. Aucune caisse à ouvrir.
import { all, one, run, tx, nowIso } from "../db";

export type Paiement = "especes" | "tmoney" | "flooz" | "credit";

export type Vente = {
  id: number;
  date: string;
  paiement: Paiement;
  total: number;
  note: string | null;
  user_id: number | null;
};

export type LigneVente = {
  id: number;
  vente_id: number;
  produit_id: number | null;
  nom_produit: string;
  quantite: number;
  prix_unitaire: number;
  cout_unitaire: number;
  frais_unitaire: number;
  total: number;
};

export type VenteAvecLignes = Vente & { lignes: LigneVente[] };

function bornesDuJour(): { debut: string; fin: string } {
  const d = new Date();
  const debut = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
  const fin = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1, 0, 0, 0, 0);
  return { debut: debut.toISOString(), fin: fin.toISOString() };
}

export function listVentesDuJour(): VenteAvecLignes[] {
  const { debut, fin } = bornesDuJour();
  const ventes = all<Vente>(
    `SELECT * FROM vente WHERE date >= ? AND date < ? ORDER BY date DESC, id DESC`,
    debut,
    fin
  );
  return ventes.map((v) => ({
    ...v,
    lignes: all<LigneVente>(
      `SELECT * FROM ligne_vente WHERE vente_id = ? ORDER BY id`,
      v.id
    ),
  }));
}

export type CreateVenteInput = {
  paiement: Paiement;
  lignes: { produitId: number; quantite: number }[];
  note?: string | null;
  userId?: number | null;
};

export function createVente(input: CreateVenteInput): number {
  if (!input.lignes.length) throw new Error("Aucun produit dans la vente.");

  return tx(() => {
    const now = nowIso();
    const venteId = run(
      `INSERT INTO vente (date, paiement, total, note, user_id) VALUES (?,?,?,?,?)`,
      now,
      input.paiement,
      0,
      input.note ?? null,
      input.userId ?? null
    ).lastId;

    let total = 0;
    for (const l of input.lignes) {
      if (l.quantite <= 0) continue;
      const prod = one<{
        nom: string;
        prix_vente: number;
        prix_achat: number;
        frais: number;
        stock: number;
      }>(
        `SELECT nom, prix_vente, prix_achat, frais, stock FROM produit WHERE id = ?`,
        l.produitId
      );
      if (!prod) throw new Error("Produit introuvable dans la vente.");

      const ligneTotal = prod.prix_vente * l.quantite;
      total += ligneTotal;

      run(
        `INSERT INTO ligne_vente
           (vente_id, produit_id, nom_produit, quantite, prix_unitaire, cout_unitaire, frais_unitaire, total)
         VALUES (?,?,?,?,?,?,?,?)`,
        venteId,
        l.produitId,
        prod.nom,
        l.quantite,
        prod.prix_vente,
        prod.prix_achat,
        prod.frais,
        ligneTotal
      );

      const stockAvant = prod.stock;
      const stockApres = stockAvant - l.quantite;
      run(
        `UPDATE produit SET stock = ?, maj_le = ? WHERE id = ?`,
        stockApres,
        now,
        l.produitId
      );
      run(
        `INSERT INTO mouvement_stock
           (produit_id, type, quantite, stock_avant, stock_apres, raison, ref_id, user_id, date)
         VALUES (?,?,?,?,?,?,?,?,?)`,
        l.produitId,
        "vente",
        -l.quantite,
        stockAvant,
        stockApres,
        "Vente",
        venteId,
        input.userId ?? null,
        now
      );
    }

    run(`UPDATE vente SET total = ? WHERE id = ?`, total, venteId);
    return venteId;
  });
}

export function deleteVente(id: number): void {
  const lignes = all<LigneVente>(
    `SELECT * FROM ligne_vente WHERE vente_id = ?`,
    id
  );
  if (!one(`SELECT id FROM vente WHERE id = ?`, id)) return;

  tx(() => {
    const now = nowIso();
    for (const l of lignes) {
      if (l.produit_id == null) continue;
      const prod = one<{ stock: number }>(
        `SELECT stock FROM produit WHERE id = ?`,
        l.produit_id
      );
      const stockAvant = prod?.stock ?? 0;
      const stockApres = stockAvant + l.quantite; // on remet le stock
      run(
        `UPDATE produit SET stock = ?, maj_le = ? WHERE id = ?`,
        stockApres,
        now,
        l.produit_id
      );
      run(
        `INSERT INTO mouvement_stock
           (produit_id, type, quantite, stock_avant, stock_apres, raison, ref_id, user_id, date)
         VALUES (?,?,?,?,?,?,?,?,?)`,
        l.produit_id,
        "correction",
        l.quantite,
        stockAvant,
        stockApres,
        "Suppression de vente",
        id,
        null,
        now
      );
    }
    // ligne_vente est supprimée en cascade (ON DELETE CASCADE).
    run(`DELETE FROM vente WHERE id = ?`, id);
  });
}
