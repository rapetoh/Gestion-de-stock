"use server";

import { revalidatePath } from "next/cache";
import { parseCFA } from "@/lib/money";
import { getSession } from "@/lib/auth";
import { getProduitParNom, createProduit } from "@/lib/repo/produits";
import { createAchat, deleteAchat } from "@/lib/repo/achats";

export async function enregistrerAchat(formData: FormData): Promise<void> {
  const nom = String(formData.get("nom") ?? "").trim();
  if (!nom) return;

  const quantite = parseCFA(String(formData.get("quantite") ?? ""));
  const prixAchat = parseCFA(String(formData.get("prixAchat") ?? ""));
  const frais = parseCFA(String(formData.get("frais") ?? ""));
  const prixVente = parseCFA(String(formData.get("prixVente") ?? ""));
  const fournisseur = String(formData.get("fournisseur") ?? "").trim() || null;
  const note = String(formData.get("note") ?? "").trim() || null;

  if (quantite <= 0) return;

  // Le produit existe par son nom ? Sinon on le crée.
  const existant = getProduitParNom(nom);
  const produitId = existant
    ? existant.id
    : createProduit({ nom, prixAchat, frais, prixVente });

  const session = await getSession();

  createAchat({
    produitId,
    quantite,
    prixAchat,
    frais,
    prixVente,
    fournisseur,
    note,
    userId: session?.userId ?? null,
  });

  revalidatePath("/achats");
  revalidatePath("/stock");
  revalidatePath("/");
}

export async function supprimerAchat(formData: FormData): Promise<void> {
  const id = Number(formData.get("id"));
  if (!id) return;
  deleteAchat(id);
  revalidatePath("/achats");
  revalidatePath("/stock");
  revalidatePath("/");
}
