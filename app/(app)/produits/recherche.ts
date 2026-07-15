"use server";

import { getSession } from "@/lib/auth";
import { chercherProduits, type Produit } from "@/lib/repo/produits";

// Pour la caisse (accessible à la vendeuse) : on ne renvoie QUE le strict nécessaire, pas le coût.
export type ProduitVente = { id: number; nom: string; prix_vente: number; stock: number };

export async function rechercherPourVente(q: string): Promise<ProduitVente[]> {
  const session = await getSession();
  if (!session) return [];
  return chercherProduits(q, 15).map((p) => ({
    id: p.id,
    nom: p.nom,
    prix_vente: p.prix_vente,
    stock: p.stock,
  }));
}

// Pour les achats (réservé à la propriétaire par le middleware) : produit complet pour pré-remplir.
export async function rechercherPourAchat(q: string): Promise<Produit[]> {
  const session = await getSession();
  if (!session || session.role !== "proprietaire") return [];
  return chercherProduits(q, 15);
}
