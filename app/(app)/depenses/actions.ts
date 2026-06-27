"use server";

import { revalidatePath } from "next/cache";
import { parseCFA } from "@/lib/money";
import { getSession } from "@/lib/auth";
import {
  createDepense,
  updateDepense,
  deleteDepense,
} from "@/lib/repo/depenses";

export async function ajouterDepense(formData: FormData): Promise<void> {
  const libelle = String(formData.get("libelle") ?? "").trim();
  if (!libelle) return;
  const session = await getSession();
  createDepense({
    libelle,
    montant: parseCFA(String(formData.get("montant") ?? "")),
    categorie: String(formData.get("categorie") ?? "").trim() || null,
    recurrente: formData.get("recurrente") != null,
    date: String(formData.get("date") ?? "").trim() || null,
    userId: session?.userId ?? null,
  });
  revalidatePath("/depenses");
  revalidatePath("/benefices");
  revalidatePath("/");
}

export async function modifierDepense(formData: FormData): Promise<void> {
  const id = Number(formData.get("id"));
  const libelle = String(formData.get("libelle") ?? "").trim();
  if (!id || !libelle) return;
  updateDepense(id, {
    libelle,
    montant: parseCFA(String(formData.get("montant") ?? "")),
    categorie: String(formData.get("categorie") ?? "").trim() || null,
    recurrente: formData.get("recurrente") != null,
    date: String(formData.get("date") ?? "").trim() || null,
  });
  revalidatePath("/depenses");
  revalidatePath("/benefices");
  revalidatePath("/");
}

export async function supprimerDepense(formData: FormData): Promise<void> {
  const id = Number(formData.get("id"));
  if (!id) return;
  deleteDepense(id);
  revalidatePath("/depenses");
  revalidatePath("/benefices");
  revalidatePath("/");
}
