"use server";

import { revalidatePath } from "next/cache";
import { parseCFA } from "@/lib/money";
import { parseProduitsTexte } from "@/lib/import";
import { getSession } from "@/lib/auth";
import {
  createProduit,
  updateProduit,
  removeProduit,
  importerProduits,
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

export type ImportState = {
  ok?: boolean;
  crees?: number;
  maj?: number;
  ignores?: number;
  error?: string;
} | null;

export async function importerProduitsAction(
  _prev: ImportState,
  formData: FormData
): Promise<ImportState> {
  const rows = parseProduitsTexte(String(formData.get("texte") ?? ""));
  if (!rows.length) {
    return { error: "Aucun produit à importer. Colle au moins une ligne." };
  }
  const session = await getSession();
  const res = importerProduits(rows, session?.userId ?? null);
  revalidatePath("/produits");
  revalidatePath("/stock");
  return { ok: true, crees: res.crees, maj: res.maj, ignores: res.ignores };
}
