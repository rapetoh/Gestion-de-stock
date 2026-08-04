"use server";

import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth";
import {
  ajouterCategorie,
  renommerCategorie,
  supprimerCategorie,
} from "@/lib/repo/categories";

function rafraichir(): void {
  revalidatePath("/produits/categories");
  revalidatePath("/produits");
  revalidatePath("/achats");
  revalidatePath("/stock");
}

export async function ajouterCategorieAction(formData: FormData): Promise<void> {
  const nom = String(formData.get("nom") ?? "").trim();
  if (!nom) return;
  const session = await getSession();
  ajouterCategorie(nom, session?.userId ?? null);
  rafraichir();
}

export async function renommerCategorieAction(formData: FormData): Promise<void> {
  const id = Number(formData.get("id"));
  const nom = String(formData.get("nom") ?? "").trim();
  if (!id || !nom) return;
  const session = await getSession();
  renommerCategorie(id, nom, session?.userId ?? null);
  rafraichir();
}

export async function supprimerCategorieAction(formData: FormData): Promise<void> {
  const id = Number(formData.get("id"));
  if (!id) return;
  const session = await getSession();
  supprimerCategorie(id, session?.userId ?? null);
  rafraichir();
}
