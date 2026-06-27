"use server";

import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth";
import { enregistrerControle } from "@/lib/repo/controle";

export async function enregistrerControleAction(
  formData: FormData
): Promise<void> {
  let lignes: { produitId: number; compte: number }[] = [];
  try {
    const parsed = JSON.parse(String(formData.get("lignes") ?? "[]"));
    if (Array.isArray(parsed)) {
      lignes = parsed
        .map((l) => ({ produitId: Number(l.produitId), compte: Number(l.compte) }))
        .filter(
          (l) => l.produitId > 0 && Number.isFinite(l.compte) && l.compte >= 0
        );
    }
  } catch {
    lignes = [];
  }

  if (!lignes.length) return;

  const note = String(formData.get("note") ?? "").trim() || null;
  const session = await getSession();
  enregistrerControle({ note, lignes, userId: session?.userId ?? null });

  revalidatePath("/controle");
  revalidatePath("/stock");
  revalidatePath("/");
}
