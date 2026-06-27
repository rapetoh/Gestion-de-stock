"use server";

import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth";
import { enregistrerReconciliation } from "@/lib/repo/comptes";

export async function enregistrerSoldesAction(formData: FormData): Promise<void> {
  const jour = String(formData.get("jour") ?? "").trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(jour)) return;

  let lignes: { compteId: number; attendu: number; compte: number }[] = [];
  try {
    const parsed = JSON.parse(String(formData.get("lignes") ?? "[]"));
    if (Array.isArray(parsed)) {
      lignes = parsed
        .map((l) => ({
          compteId: Number(l.compteId),
          attendu: Number(l.attendu),
          compte: Number(l.compte),
        }))
        .filter(
          (l) =>
            l.compteId > 0 &&
            Number.isFinite(l.attendu) &&
            Number.isFinite(l.compte) &&
            l.compte >= 0
        );
    }
  } catch {
    lignes = [];
  }

  if (!lignes.length) return;

  const session = await getSession();
  enregistrerReconciliation({ jour, lignes, userId: session?.userId ?? null });
  revalidatePath("/soldes");
  revalidatePath("/");
}
