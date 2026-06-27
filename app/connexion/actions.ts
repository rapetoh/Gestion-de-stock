"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { one } from "@/lib/db";
import { createSession } from "@/lib/auth";
import { journaliser } from "@/lib/repo/activite";

type Utilisateur = {
  id: number;
  nom: string;
  mot_de_passe: string;
  role: string;
  actif: number;
};

export type ConnexionState = { error?: string };

export async function connexion(
  _prev: ConnexionState,
  formData: FormData
): Promise<ConnexionState> {
  const login = String(formData.get("login") ?? "").trim();
  const motDePasse = String(formData.get("motDePasse") ?? "");

  if (!login || !motDePasse) {
    return { error: "Entre ton identifiant et ton mot de passe." };
  }

  const user = one<Utilisateur>(
    `SELECT id, nom, mot_de_passe, role, actif FROM utilisateur WHERE login = ? AND actif = 1`,
    login
  );

  if (!user || !bcrypt.compareSync(motDePasse, user.mot_de_passe)) {
    return { error: "Identifiant ou mot de passe incorrect." };
  }

  await createSession({ userId: user.id, nom: user.nom, role: user.role });
  journaliser({
    userId: user.id,
    action: "connexion",
    entite: "session",
    details: "Connexion à l'application",
  });
  redirect("/");
}
