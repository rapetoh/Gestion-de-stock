"use server";

import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth";
import {
  creerVendeuse,
  definirActif,
  reinitialiserMotDePasse,
} from "@/lib/repo/utilisateurs";

export type EquipeState = { error?: string; ok?: string };

// Garde-fou serveur (en plus du middleware) : ces actions sont réservées au propriétaire.
async function exigerProprietaire() {
  const s = await getSession();
  return s && s.role === "proprietaire" ? s : null;
}

export async function ajouterVendeuse(
  _prev: EquipeState,
  formData: FormData
): Promise<EquipeState> {
  const s = await exigerProprietaire();
  if (!s) return { error: "Action réservée au propriétaire." };
  const res = creerVendeuse(
    {
      nom: String(formData.get("nom") ?? ""),
      login: String(formData.get("login") ?? ""),
      motDePasse: String(formData.get("motDePasse") ?? ""),
    },
    s.userId
  );
  if (!res.ok) return { error: res.erreur };
  revalidatePath("/equipe");
  return { ok: "Compte créé ✓" };
}

export async function basculerActif(formData: FormData): Promise<void> {
  const s = await exigerProprietaire();
  if (!s) return;
  const id = Number(formData.get("id"));
  const actifActuel = String(formData.get("actif")) === "1";
  if (!id) return;
  definirActif(id, !actifActuel, s.userId);
  revalidatePath("/equipe");
}

export async function reinitialiserMotDePasseAction(formData: FormData): Promise<void> {
  const s = await exigerProprietaire();
  if (!s) return;
  const id = Number(formData.get("id"));
  const motDePasse = String(formData.get("motDePasse") ?? "");
  if (!id || motDePasse.length < 4) return;
  reinitialiserMotDePasse(id, motDePasse, s.userId);
  revalidatePath("/equipe");
}
