// Parseur d'import de produits — générique, partagé par l'aperçu (client) et l'action (serveur).
//
// Principe : on ne suppose RIEN de la structure du fichier. On lit les colonnes telles qu'elles
// arrivent (2 ou 30, dans n'importe quel ordre, avec colonnes en trop, ligne de titre au-dessus,
// colonnes en double…). L'utilisateur confirme, colonne par colonne, ce que chacune représente
// (« mapping »). Une détection automatique propose un mapping de départ, toujours corrigeable.
// Seul « Nom » est requis ; les colonnes non assignées sont ignorées. Une cellule vide reste
// « non fournie » (undefined), jamais 0.
export type ImportRow = {
  nom: string;
  prixAchat?: number;
  frais?: number;
  prixVente?: number;
  stock?: number;
  seuilStock?: number;
  categorie?: string | null;
  // Toujours du texte (jamais un nombre) : un code-barres garde ses zéros de tête.
  codeBarre?: string;
};

export type Champ =
  | "nom"
  | "prixAchat"
  | "frais"
  | "prixVente"
  | "stock"
  | "seuilStock"
  | "categorie"
  | "codeBarre";

// Tous les champs assignables, dans l'ordre où on les présente à l'utilisateur.
export const CHAMPS: Champ[] = [
  "nom",
  "prixAchat",
  "frais",
  "prixVente",
  "stock",
  "seuilStock",
  "categorie",
  "codeBarre",
];

export const LABELS: Record<Champ, string> = {
  nom: "Nom",
  prixAchat: "Prix d'achat",
  frais: "Frais",
  prixVente: "Prix de vente",
  stock: "Stock",
  seuilStock: "Seuil",
  categorie: "Catégorie",
  codeBarre: "Code-barres",
};

// Ordre par défaut quand il n'y a pas d'en-tête (rétrocompatible avec l'ancien format positionnel).
export const ORDRE_DEFAUT: Champ[] = [
  "nom",
  "prixAchat",
  "frais",
  "prixVente",
  "stock",
  "seuilStock",
  "categorie",
  "codeBarre",
];

// Synonymes d'en-tête. Ordre des CHAMPS important : on teste « achat/frais » avant « prix »,
// et « seuil » avant « stock », pour éviter les collisions (« prix d'achat », « seuil de stock »).
const SYNONYMES: [Champ, string[]][] = [
  // Testé AVANT « nom » : « Code produit » / « Code article » doivent tomber ici,
  // pas sur nom (le match est par inclusion). « code a bar » couvre « Code à bars ».
  ["codeBarre", ["code barre", "codebarre", "code a bar", "ean", "upc", "barcode", "gencod", "code"]],
  ["nom", ["nom", "produit", "article", "designation", "libelle", "name", "item"]],
  ["prixAchat", ["prix d achat", "prix achat", "achat", "cout de revient", "prix de revient", "cout", "cost", "purchase"]],
  ["frais", ["frais", "transport", "livraison", "shipping"]],
  ["prixVente", ["prix de vente", "prix vente", "prix unitaire", "vente", "prix", "price", "sell"]],
  ["seuilStock", ["seuil de stock", "stock minimum", "seuil", "minimum", "reorder"]],
  ["stock", ["stock", "quantite", "qte", "quantity", "qty", "disponible"]],
  ["categorie", ["categorie", "category", "rayon", "famille", "groupe", "type"]],
];

function normalise(s: string): string {
  return (s ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // enlève les accents (marques combinantes)
    .replace(/[^a-z0-9 ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// Synonymes « faibles » : trop génériques pour gagner face à une colonne plus précise.
// Un « Code » fourre-tout (catégories, XX…) ne doit jamais voler le champ code-barres
// à une vraie colonne « Code à bars » présente ailleurs dans le même en-tête.
const FAIBLES = new Set(["code"]);

function champPourEntete(entete: string, strict = false): Champ | null {
  const h = normalise(entete);
  if (!h) return null;
  // En passe stricte, une colonne contenant un mot faible (« Code », « Code produit »…)
  // est entièrement reportée à la 2e passe : on ne la laisse ni prendre le code-barres
  // à la place d'une vraie colonne « Code à bars », ni se faire manger par « nom ».
  if (strict) {
    for (const f of FAIBLES) {
      if (h.includes(normalise(f))) {
        // …sauf si elle correspond à un synonyme FORT du code-barres (« code barre »…).
        for (const s of SYNONYMES[0][1]) {
          if (!FAIBLES.has(s) && (h === normalise(s) || h.includes(normalise(s)))) {
            return "codeBarre";
          }
        }
        return null;
      }
    }
  }
  for (const [champ, syns] of SYNONYMES) {
    for (const s of syns) {
      if (strict && FAIBLES.has(s)) continue;
      const n = normalise(s);
      if (h === n || h.includes(n)) return champ;
    }
  }
  return null;
}

// Nombres venant de fichiers. Les exports de logiciels écrivent des décimales flottantes
// (« 999.9997 » pour 1 000 F, « 2133.3328 »…) — le F CFA n'a pas de centimes, on arrondit.
// Cas gardé : « 1.500 » à la française (point des milliers, partie entière courte) = 1500.
export function parseNombreImport(brut: string): number {
  let s = brut.trim().replace(/\s|(F\s*CFA|FCFA|CFA|F)$/gi, "");
  if (!s) return 0;
  const dernierPoint = s.lastIndexOf(".");
  const derniereVirgule = s.lastIndexOf(",");
  if (dernierPoint >= 0 && derniereVirgule >= 0) {
    // Les deux présents : le dernier est le séparateur décimal, l'autre fait les milliers.
    const dec = Math.max(dernierPoint, derniereVirgule);
    s = s.slice(0, dec).replace(/[.,]/g, "") + "." + s.slice(dec + 1).replace(/[.,]/g, "");
  } else {
    const sep = dernierPoint >= 0 ? "." : derniereVirgule >= 0 ? "," : null;
    if (sep) {
      const parties = s.split(sep);
      const frac = parties[parties.length - 1];
      const entier = parties.slice(0, -1).join("");
      // Plusieurs séparateurs (1.234.567) ou motif milliers (1.500) → milliers.
      const milliers = parties.length > 2 || (frac.length === 3 && entier.length <= 3);
      s = milliers ? parties.join("") : entier + "." + frac;
    }
  }
  const n = Number.parseFloat(s.replace(/[^\d.-]/g, ""));
  return Number.isFinite(n) ? Math.round(n) : 0;
}

function maybeNum(cell?: string): number | undefined {
  const s = (cell ?? "").trim();
  return s === "" ? undefined : parseNombreImport(s);
}

function detecterDelim(ligne: string): string {
  return ligne.includes("\t") ? "\t" : ligne.includes(";") ? ";" : ",";
}

// ── Primitives génériques ────────────────────────────────────────────────────

export type Grille = { lignes: string[][]; delim: string };

// Découpe UNE ligne en cellules, en respectant les guillemets CSV : une cellule
// "APTA COLOR FIXATEUR 1,5 L" contient une virgule sans casser la colonne, et «""»
// dans une cellule entre guillemets est un guillemet échappé.
function decouperLigne(ligne: string, delim: string): string[] {
  const cellules: string[] = [];
  let cour = "";
  let entreGuillemets = false;
  for (let i = 0; i < ligne.length; i++) {
    const c = ligne[i];
    if (c === '"') {
      if (entreGuillemets && ligne[i + 1] === '"') {
        cour += '"';
        i++;
      } else {
        entreGuillemets = !entreGuillemets;
      }
    } else if (c === delim && !entreGuillemets) {
      cellules.push(cour.trim());
      cour = "";
    } else {
      cour += c;
    }
  }
  cellules.push(cour.trim());
  return cellules;
}

// Découpe le texte en grille de cellules (BOM enlevé, lignes vides ignorées, délimiteur auto :
// tabulation, point-virgule, ou virgule ; guillemets CSV respectés). Aucune hypothèse sur l'en-tête.
export function parseGrille(texte: string): Grille {
  const brutes = (texte ?? "")
    .replace(/^﻿/, "")
    .split(/\r?\n/)
    .filter((l) => l.trim() !== "");
  if (!brutes.length) return { lignes: [], delim: "," };
  const delim = detecterDelim(brutes[0]);
  const lignes = brutes.map((l) => decouperLigne(l, delim));
  return { lignes, delim };
}

// Propose un champ pour chaque colonne d'une ligne d'en-tête. Chaque champ n'est attribué
// QU'UNE fois (la 1re colonne qui correspond gagne) — ainsi « En stock » l'emporte sur
// « Total en stock » / « Qté », et « Prix d'achat unit. » sur une colonne « Prix d'achat » vide.
// Deux passes : d'abord les correspondances précises sur TOUTES les colonnes (« Code à bars »
// prend le code-barres), puis les génériques sur ce qui reste (« Code » seul peut encore
// servir s'il n'y a pas mieux ailleurs).
export function autoMapper(entete: string[]): (Champ | null)[] {
  const vus = new Set<Champ>();
  const result: (Champ | null)[] = entete.map((cell) => {
    const champ = champPourEntete(cell, true);
    if (!champ || vus.has(champ)) return null;
    vus.add(champ);
    return champ;
  });
  entete.forEach((cell, i) => {
    if (result[i]) return;
    const champ = champPourEntete(cell, false);
    if (!champ || vus.has(champ)) return;
    vus.add(champ);
    result[i] = champ;
  });
  return result;
}

// Devine quelle ligne est l'en-tête : parmi les premières lignes, celle qui reconnaît le plus de
// champs (≥ 2). Saute ainsi une ligne de titre (« Gestion des produits… ») posée au-dessus.
// Renvoie -1 si aucun en-tête crédible (→ mode positionnel par défaut).
export function devinerEnteteIndex(lignes: string[][]): number {
  const N = Math.min(lignes.length, 8);
  let best = 0;
  let bestCount = -1;
  for (let i = 0; i < N; i++) {
    const c = autoMapper(lignes[i]).filter(Boolean).length;
    if (c > bestCount) {
      bestCount = c;
      best = i;
    }
  }
  return bestCount >= 2 ? best : -1;
}

// Construit les lignes-produit à partir d'un mapping EXPLICITE (champ par index de colonne) et de
// l'index de la ligne d'en-tête (-1 = pas d'en-tête : les données commencent à la 1re ligne).
// Les colonnes non mappées (null) sont ignorées. Une ligne sans nom est sautée.
export function construireRows(
  lignes: string[][],
  enteteIndex: number,
  mapping: (Champ | null)[]
): ImportRow[] {
  const donnees = enteteIndex >= 0 ? lignes.slice(enteteIndex + 1) : lignes;
  const rows: ImportRow[] = [];
  for (const cols of donnees) {
    const row: ImportRow = { nom: "" };
    mapping.forEach((champ, i) => {
      if (!champ) return;
      const val = cols[i];
      if (champ === "nom") row.nom = (val ?? "").trim();
      else if (champ === "categorie") row.categorie = (val ?? "").trim() || undefined;
      else if (champ === "codeBarre") row.codeBarre = (val ?? "").trim() || undefined;
      else row[champ] = maybeNum(val);
    });
    const nom = row.nom.trim();
    if (!nom) continue;
    // En mode sans en-tête, ignore une ligne d'en-tête restée par mégarde.
    if (enteteIndex < 0 && /^(nom|produit)$/i.test(nom)) continue;
    rows.push(row);
  }
  return rows;
}

// ── Détection automatique de bout en bout (aperçu par défaut, action sans mapping) ───────────

export type ImportResult = {
  rows: ImportRow[];
  colonnes: string[]; // libellés des champs reconnus, pour l'aperçu
  avecEntete: boolean;
  // Mapping résolu, champ ← colonne source : pour montrer ce que l'import a compris
  // (« Nom ← Produit », « Stock ← En stock »…) avant de valider.
  mapping: { champ: Champ; source: string }[];
};

export function parseProduitsTexte(texte: string): ImportResult {
  const { lignes } = parseGrille(texte);
  if (!lignes.length) return { rows: [], colonnes: [], avecEntete: false, mapping: [] };

  const enteteIndex = devinerEnteteIndex(lignes);
  const avecEntete = enteteIndex >= 0;
  const mapping: (Champ | null)[] = avecEntete
    ? autoMapper(lignes[enteteIndex])
    : ORDRE_DEFAUT;

  const rows = construireRows(lignes, avecEntete ? enteteIndex : -1, mapping);

  const champsMap = avecEntete
    ? (mapping
        .map((c, i) => (c ? { champ: c, source: lignes[enteteIndex][i] || LABELS[c] } : null))
        .filter(Boolean) as { champ: Champ; source: string }[])
    : [];

  return {
    rows,
    colonnes: champsMap.map((c) => LABELS[c.champ]),
    avecEntete,
    mapping: champsMap,
  };
}
