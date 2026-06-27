"use server";

import { revalidatePath } from "next/cache";
import { parseCFA } from "@/lib/money";
import { getSession } from "@/lib/auth";
import { getProduitParNom, createProduit } from "@/lib/repo/produits";
import { createAchat, updateAchat, deleteAchat } from "@/lib/repo/achats";

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

  const session = await getSession();

  // Le produit existe par son nom ? Sinon on le crée.
  const existant = getProduitParNom(nom);
  const produitId = existant
    ? existant.id
    : createProduit({ nom, prixAchat, frais, prixVente }, session?.userId ?? null);

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

export async function modifierAchat(formData: FormData): Promise<void> {
  const id = Number(formData.get("id"));
  if (!id) return;

  const quantite = parseCFA(String(formData.get("quantite") ?? ""));
  if (quantite <= 0) return;

  const session = await getSession();
  updateAchat(
    id,
    {
      quantite,
      prixAchat: parseCFA(String(formData.get("prixAchat") ?? "")),
      frais: parseCFA(String(formData.get("frais") ?? "")),
      prixVente: parseCFA(String(formData.get("prixVente") ?? "")),
      fournisseur: String(formData.get("fournisseur") ?? "").trim() || null,
      note: String(formData.get("note") ?? "").trim() || null,
    },
    session?.userId ?? null
  );

  revalidatePath("/achats");
  revalidatePath("/stock");
  revalidatePath("/");
}

export async function supprimerAchat(formData: FormData): Promise<void> {
  const id = Number(formData.get("id"));
  if (!id) return;
  const session = await getSession();
  deleteAchat(id, session?.userId ?? null);
  revalidatePath("/achats");
  revalidatePath("/stock");
  revalidatePath("/");
}
