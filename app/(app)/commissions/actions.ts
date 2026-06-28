"use server";

import { revalidatePath } from "next/cache";
import { parseCFA } from "@/lib/money";
import { getSession } from "@/lib/auth";
import {
  createCommission,
  updateCommission,
  deleteCommission,
} from "@/lib/repo/commissions";

function revalider() {
  revalidatePath("/commissions");
  revalidatePath("/benefices");
  revalidatePath("/");
}

export async function ajouterCommission(formData: FormData): Promise<void> {
  const libelle = String(formData.get("libelle") ?? "").trim();
  if (!libelle) return;
  const session = await getSession();
  createCommission({
    libelle,
    montant: parseCFA(String(formData.get("montant") ?? "")),
    canal: String(formData.get("canal") ?? "").trim() || null,
    date: String(formData.get("date") ?? "").trim() || null,
    userId: session?.userId ?? null,
  });
  revalider();
}

export async function modifierCommission(formData: FormData): Promise<void> {
  const id = Number(formData.get("id"));
  const libelle = String(formData.get("libelle") ?? "").trim();
  if (!id || !libelle) return;
  const session = await getSession();
  updateCommission(
    id,
    {
      libelle,
      montant: parseCFA(String(formData.get("montant") ?? "")),
      canal: String(formData.get("canal") ?? "").trim() || null,
      date: String(formData.get("date") ?? "").trim() || null,
    },
    session?.userId ?? null
  );
  revalider();
}

export async function supprimerCommission(formData: FormData): Promise<void> {
  const id = Number(formData.get("id"));
  if (!id) return;
  const session = await getSession();
  deleteCommission(id, session?.userId ?? null);
  revalider();
}
