// Repository utilisateurs — comptes de connexion. Le propriétaire gère les vendeuses.
// Pourquoi : à partir de décembre une nouvelle employée pas encore de confiance tient le comptoir.
// Avec un login PAR personne, chaque vente/modif est estampillée du vrai auteur (journal d'activité)
// et la vendeuse n'a pas accès aux marges, à l'argent, ni au droit de supprimer — l'anti-vol devient réel.
import { all, one, run, nowIso } from "../db";
import bcrypt from "bcryptjs";
import { journaliser } from "./activite";

export type Utilisateur = {
  id: number;
  nom: string;
  login: string;
  role: "proprietaire" | "vendeuse";
  actif: number;
  cree_le: string;
};

export function listUtilisateurs(): Utilisateur[] {
  return all<Utilisateur>(
    `SELECT id, nom, login, role, actif, cree_le FROM utilisateur ORDER BY role, nom`
  );
}

export function loginExiste(login: string): boolean {
  return !!one(`SELECT id FROM utilisateur WHERE login = ? COLLATE NOCASE`, login.trim());
}

export type CreerVendeuseInput = {
  nom: string;
  login: string;
  motDePasse: string;
};

// Crée une vendeuse (rôle limité). Renvoie { ok } ou un message d'erreur clair (login pris, champ vide).
export function creerVendeuse(
  input: CreerVendeuseInput,
  parUserId?: number | null
): { ok: true; id: number } | { ok: false; erreur: string } {
  const nom = input.nom.trim();
  const login = input.login.trim();
  const motDePasse = input.motDePasse;
  if (!nom) return { ok: false, erreur: "Le nom est obligatoire." };
  if (!login) return { ok: false, erreur: "L'identifiant est obligatoire." };
  if (motDePasse.length < 4)
    return { ok: false, erreur: "Le mot de passe doit faire au moins 4 caractères." };
  if (loginExiste(login))
    return { ok: false, erreur: `L'identifiant « ${login} » est déjà pris.` };

  const hash = bcrypt.hashSync(motDePasse, 10);
  const id = run(
    `INSERT INTO utilisateur (nom, login, mot_de_passe, role, actif, cree_le)
     VALUES (?,?,?,?,1,?)`,
    nom,
    login,
    hash,
    "vendeuse",
    nowIso()
  ).lastId;
  journaliser({
    userId: parUserId,
    action: "creation",
    entite: "utilisateur",
    details: `Vendeuse créée : ${nom} (${login})`,
    refId: id,
  });
  return { ok: true, id };
}

// Active/désactive un compte. On ne supprime jamais (l'historique reste attribué à la personne).
export function definirActif(id: number, actif: boolean, parUserId?: number | null): void {
  const u = one<Utilisateur>(`SELECT id, nom, role FROM utilisateur WHERE id = ?`, id);
  if (!u) throw new Error("Utilisateur introuvable.");
  if (u.role === "proprietaire") throw new Error("On ne désactive pas le propriétaire.");
  run(`UPDATE utilisateur SET actif = ? WHERE id = ?`, actif ? 1 : 0, id);
  journaliser({
    userId: parUserId,
    action: "modification",
    entite: "utilisateur",
    details: `${actif ? "Réactivation" : "Désactivation"} de ${u.nom}`,
    refId: id,
  });
}

// Redéfinit le mot de passe d'une vendeuse (oubli, départ d'une personne…).
export function reinitialiserMotDePasse(
  id: number,
  motDePasse: string,
  parUserId?: number | null
): { ok: true } | { ok: false; erreur: string } {
  if (motDePasse.length < 4)
    return { ok: false, erreur: "Le mot de passe doit faire au moins 4 caractères." };
  const u = one<Utilisateur>(`SELECT id, nom, role FROM utilisateur WHERE id = ?`, id);
  if (!u) return { ok: false, erreur: "Utilisateur introuvable." };
  if (u.role === "proprietaire")
    return { ok: false, erreur: "Change le mot de passe propriétaire depuis son propre compte." };
  run(`UPDATE utilisateur SET mot_de_passe = ? WHERE id = ?`, bcrypt.hashSync(motDePasse, 10), id);
  journaliser({
    userId: parUserId,
    action: "modification",
    entite: "utilisateur",
    details: `Mot de passe réinitialisé : ${u.nom}`,
    refId: id,
  });
  return { ok: true };
}
