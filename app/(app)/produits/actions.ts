"use server";

import { revalidatePath } from "next/cache";
import { parseCFA } from "@/lib/money";
import { getSession } from "@/lib/auth";
import {
  createProduit,
  updateProduit,
  removeProduit,
} from "@/lib/repo/produits";

export async function ajouterProduit(formData: FormData): Promise<void> {
  const nom = String(formData.get("nom") ?? "").trim();
  if (!nom) return;
  const session = await getSession();
  createProduit(
    {
      nom,
      categorie: String(formData.get("categorie") ?? "").trim() || null,
      prixAchat: parseCFA(String(formData.get("prixAchat") ?? "")),
      frais: parseCFA(String(formData.get("frais") ?? "")),
      prixVente: parseCFA(String(formData.get("prixVente") ?? "")),
      stock: parseCFA(String(formData.get("stock") ?? "")),
      seuilStock: parseCFA(String(formData.get("seuilStock") ?? "")),
      codeBarre: String(formData.get("codeBarre") ?? "").trim() || null,
    },
    session?.userId ?? null
  );
  revalidatePath("/produits");
}

export async function modifierProduit(formData: FormData): Promise<void> {
  const id = Number(formData.get("id"));
  const nom = String(formData.get("nom") ?? "").trim();
  if (!id || !nom) return;
  const session = await getSession();
  updateProduit(
    id,
    {
      nom,
      categorie: String(formData.get("categorie") ?? "").trim() || null,
      prixAchat: parseCFA(String(formData.get("prixAchat") ?? "")),
      frais: parseCFA(String(formData.get("frais") ?? "")),
      prixVente: parseCFA(String(formData.get("prixVente") ?? "")),
      stock: parseCFA(String(formData.get("stock") ?? "")),
      seuilStock: parseCFA(String(formData.get("seuilStock") ?? "")),
      codeBarre: String(formData.get("codeBarre") ?? "").trim() || null,
    },
    session?.userId ?? null
  );
  revalidatePath("/produits");
}

export async function supprimerProduit(formData: FormData): Promise<void> {
  const id = Number(formData.get("id"));
  if (!id) return;
  const session = await getSession();
  removeProduit(id, session?.userId ?? null);
  revalidatePath("/produits");
}
