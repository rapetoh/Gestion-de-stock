"use server";

import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth";
import { createVente, deleteVente, type Paiement } from "@/lib/repo/ventes";

const PAIEMENTS: Paiement[] = ["especes", "tmoney", "flooz", "credit"];

export async function encaisserVente(formData: FormData): Promise<void> {
  const paiementRaw = String(formData.get("paiement") ?? "especes");
  const paiement: Paiement = PAIEMENTS.includes(paiementRaw as Paiement)
    ? (paiementRaw as Paiement)
    : "especes";

  let lignes: { produitId: number; quantite: number }[] = [];
  try {
    const parsed = JSON.parse(String(formData.get("lignes") ?? "[]"));
    if (Array.isArray(parsed)) {
      lignes = parsed
        .map((l) => ({
          produitId: Number(l.produitId),
          quantite: Number(l.quantite),
        }))
        .filter((l) => l.produitId > 0 && l.quantite > 0);
    }
  } catch {
    lignes = [];
  }

  if (!lignes.length) return;

  const session = await getSession();
  createVente({ paiement, lignes, userId: session?.userId ?? null });

  revalidatePath("/ventes");
  revalidatePath("/stock");
  revalidatePath("/");
}

export async function supprimerVente(formData: FormData): Promise<void> {
  const id = Number(formData.get("id"));
  if (!id) return;
  deleteVente(id);
  revalidatePath("/ventes");
  revalidatePath("/stock");
  revalidatePath("/");
}
