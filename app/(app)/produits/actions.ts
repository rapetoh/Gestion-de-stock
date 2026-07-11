"use server";

import { revalidatePath } from "next/cache";
import { parseCFA } from "@/lib/money";
import {
  parseProduitsTexte,
  parseGrille,
  construireRows,
  CHAMPS,
  type Champ,
  type ImportRow,
} from "@/lib/import";
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

// Dérivé de CHAMPS (source unique) : une liste recopiée à la main ici avait déjà
// silencieusement rejeté un champ ajouté plus tard (codeBarre).
const CHAMPS_VALIDES = new Set<Champ>(CHAMPS);

export async function importerProduitsAction(
  _prev: ImportState,
  formData: FormData
): Promise<ImportState> {
  const texte = String(formData.get("texte") ?? "");

  // Mapping explicite confirmé par l'utilisateur (colonne → champ) + ligne d'en-tête.
  // Le serveur reconstruit les lignes lui-même : on ne fait jamais confiance à des lignes
  // déjà construites côté client, et on revalide tout (Nom obligatoire).
  let mapping: (Champ | null)[] | null = null;
  try {
    const brut = JSON.parse(String(formData.get("mapping") ?? "null"));
    if (Array.isArray(brut)) {
      mapping = brut.map((x) => (CHAMPS_VALIDES.has(x as Champ) ? (x as Champ) : null));
    }
  } catch {
    mapping = null;
  }

  let rows: ImportRow[];
  if (mapping) {
    if (!mapping.includes("nom")) {
      return { error: "Indique quelle colonne contient le Nom du produit (obligatoire)." };
    }
    const enteteIndex = Number(formData.get("enteteIndex"));
    const { lignes } = parseGrille(texte);
    rows = construireRows(
      lignes,
      Number.isFinite(enteteIndex) ? enteteIndex : -1,
      mapping
    );
  } else {
    // Pas de mapping fourni (rétrocompat) : détection automatique.
    rows = parseProduitsTexte(texte).rows;
  }

  if (!rows.length) {
    return { error: "Aucun produit à importer. Choisis un fichier et vérifie l'aperçu." };
  }
  const session = await getSession();
  const res = importerProduits(rows, session?.userId ?? null);
  revalidatePath("/produits");
  revalidatePath("/stock");
  return { ok: true, crees: res.crees, maj: res.maj, ignores: res.ignores };
}
