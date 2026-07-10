"use client";

import { useActionState, useMemo, useState } from "react";
import Link from "next/link";
import {
  parseGrille,
  autoMapper,
  devinerEnteteIndex,
  construireRows,
  CHAMPS,
  LABELS,
  ORDRE_DEFAUT,
  type Champ,
} from "@/lib/import";
import { formatCFA } from "@/lib/money";
import { importerProduitsAction, type ImportState } from "../actions";

const EXEMPLE = `Nom;Prix de vente;Stock;Catégorie
Savon Paris amande;750;50;Cosmétique
Eau en sachet (paquet);500;100;Eau
Lait concentré (boîte);500;48;Alimentation`;

type Choix = Champ | ""; // "" = colonne ignorée

export default function ImportProduits({ existants }: { existants: string[] }) {
  const dejaLa = useMemo(
    () => new Set(existants.map((n) => n.toLowerCase())),
    [existants]
  );

  const [texte, setTexte] = useState("");
  const [enteteIndex, setEnteteIndex] = useState<number>(-1);
  const [mapping, setMapping] = useState<Choix[]>([]);
  const [state, formAction, pending] = useActionState<ImportState, FormData>(
    importerProduitsAction,
    null
  );

  const grille = useMemo(() => parseGrille(texte), [texte]);
  const maxCols = useMemo(
    () => grille.lignes.reduce((m, l) => Math.max(m, l.length), 0),
    [grille]
  );
  const nbLignesEntete = Math.min(grille.lignes.length, 8);

  // Quand la source change (nouveau fichier, collage, exemple), propose un en-tête + un mapping
  // de départ — corrigeables ensuite. Motif React recommandé : on ajuste l'état pendant le rendu
  // (pas dans un effet), ça se stabilise dès que la signature correspond.
  const [sig, setSig] = useState<string | null>(null);
  if (sig !== texte) {
    const idx = devinerEnteteIndex(grille.lignes);
    const base: (Champ | null)[] = idx >= 0 ? autoMapper(grille.lignes[idx]) : ORDRE_DEFAUT;
    setEnteteIndex(idx);
    setMapping(Array.from({ length: maxCols }, (_, i) => (base[i] ?? "")) as Choix[]);
    setSig(texte);
  }

  async function onFichier(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    const contenu = await f.text(); // le BOM éventuel est géré par le parseur
    setTexte(contenu);
    e.target.value = ""; // permet de re-choisir le même fichier
  }

  // Change la ligne d'en-tête → re-propose un mapping automatique pour cette ligne.
  function changerEntete(idx: number) {
    const base: (Champ | null)[] =
      idx >= 0 ? autoMapper(grille.lignes[idx] ?? []) : ORDRE_DEFAUT;
    setEnteteIndex(idx);
    setMapping(Array.from({ length: maxCols }, (_, i) => (base[i] ?? "")) as Choix[]);
  }

  // Assigne un champ à une colonne. Unicité : un même champ ne peut être sur deux colonnes.
  function changerColonne(col: number, champ: Choix) {
    setMapping((prev) => {
      const next = [...prev];
      if (champ) for (let i = 0; i < next.length; i++) if (next[i] === champ) next[i] = "";
      next[col] = champ;
      return next;
    });
  }

  const champMapping = useMemo<(Champ | null)[]>(
    () => mapping.map((x) => (x === "" ? null : x)),
    [mapping]
  );
  const rows = useMemo(
    () => construireRows(grille.lignes, enteteIndex, champMapping),
    [grille, enteteIndex, champMapping]
  );

  const nomMappe = mapping.includes("nom");
  const charge = maxCols > 0;

  const sourceLabel = (i: number) =>
    (enteteIndex >= 0 ? grille.lignes[enteteIndex]?.[i] : "") || `Colonne ${i + 1}`;

  const resume = mapping
    .map((champ, i) => (champ ? { champ, source: sourceLabel(i) } : null))
    .filter(Boolean) as { champ: Champ; source: string }[];

  // Cross-checks affichés avant l'import.
  const occurrences = useMemo(() => {
    const m = new Map<string, number>();
    for (const r of rows) {
      const k = r.nom.toLowerCase();
      m.set(k, (m.get(k) ?? 0) + 1);
    }
    return m;
  }, [rows]);
  const nbNouveaux = rows.filter((r) => !dejaLa.has(r.nom.toLowerCase())).length;
  const nbMaj = rows.length - nbNouveaux;
  const nbDoublons = [...occurrences.values()].filter((n) => n > 1).length;
  const nbSansPrix = rows.filter(
    (r) => !dejaLa.has(r.nom.toLowerCase()) && !r.prixVente
  ).length;

  const pretAImporter = charge && nomMappe && rows.length > 0;

  return (
    <div className="grid" style={{ gridTemplateColumns: "1fr 1fr", alignItems: "start" }}>
      <div className="card">
        <form action={formAction}>
          <h2>1. Charger ta liste</h2>
          <div className="hint">
            <strong>Depuis Excel :</strong> Fichier → Enregistrer sous → <strong>CSV</strong>{" "}
            (le fichier <em>.xlsx</em> n&apos;est pas lu directement). Puis choisis ce fichier ci-dessous
            — ou colle directement la liste. Peu importe l&apos;ordre des colonnes, les colonnes en trop,
            ou une ligne de titre en haut : tu diras toi-même, juste après, ce que chaque colonne
            représente.
          </div>

          <div className="field" style={{ marginTop: 12, marginBottom: 4 }}>
            <label>
              Choisir un fichier <span className="sub">(.csv, .tsv, .txt)</span>
            </label>
            <input
              className="input"
              type="file"
              accept=".csv,.tsv,.txt,text/csv,text/tab-separated-values,text/plain"
              onChange={onFichier}
            />
          </div>

          <textarea
            className="input"
            name="texte"
            value={texte}
            onChange={(e) => setTexte(e.target.value)}
            placeholder={EXEMPLE}
            rows={8}
            style={{ width: "100%", fontFamily: "monospace", marginTop: 10 }}
          />
          <button
            type="button"
            className="btn ghost"
            style={{ marginTop: 8 }}
            onClick={() => setTexte(EXEMPLE)}
          >
            Mettre un exemple
          </button>

          {charge ? (
            <>
              <h2 style={{ marginTop: 22 }}>2. Dire ce que chaque colonne contient</h2>
              <div className="hint">
                On a proposé une correspondance automatique — <strong>vérifie-la et corrige-la</strong>{" "}
                si besoin. Le <strong>Nom est obligatoire</strong> ; tout ce que tu laisses sur
                « Ignorer » n&apos;est pas importé.
              </div>

              <div className="field" style={{ marginTop: 10 }}>
                <label>Quelle ligne contient les titres de colonnes ?</label>
                <select
                  className="input"
                  value={enteteIndex}
                  onChange={(e) => changerEntete(Number(e.target.value))}
                >
                  <option value={-1}>Aucune (lire dès la 1re ligne, ordre par défaut)</option>
                  {Array.from({ length: nbLignesEntete }, (_, i) => (
                    <option key={i} value={i}>
                      Ligne {i + 1} : {grille.lignes[i].join(" | ").slice(0, 60)}
                    </option>
                  ))}
                </select>
              </div>

              <table style={{ marginTop: 10 }}>
                <thead>
                  <tr>
                    <th>Colonne du fichier</th>
                    <th>Exemple</th>
                    <th>= devient</th>
                  </tr>
                </thead>
                <tbody>
                  {Array.from({ length: maxCols }, (_, i) => {
                    const exemple =
                      grille.lignes[enteteIndex >= 0 ? enteteIndex + 1 : 0]?.[i] ?? "";
                    return (
                      <tr key={i}>
                        <td className="prod">{sourceLabel(i)}</td>
                        <td className="muted">{exemple || "—"}</td>
                        <td>
                          <select
                            className="input"
                            value={mapping[i] ?? ""}
                            onChange={(e) => changerColonne(i, e.target.value as Choix)}
                            style={{ padding: "6px 8px" }}
                          >
                            <option value="">Ignorer</option>
                            {CHAMPS.map((c) => (
                              <option key={c} value={c}>
                                {LABELS[c]}
                                {c === "nom" ? " (obligatoire)" : ""}
                              </option>
                            ))}
                          </select>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              <h2 style={{ marginTop: 22 }}>3. Importer</h2>
              {!nomMappe ? (
                <div className="note" style={{ color: "var(--danger)" }}>
                  Choisis d&apos;abord quelle colonne est le <strong>Nom</strong> du produit.
                </div>
              ) : null}

              <input type="hidden" name="enteteIndex" value={enteteIndex} />
              <input type="hidden" name="mapping" value={JSON.stringify(champMapping)} />
              <button
                type="submit"
                className="btn primary big"
                style={{ marginTop: 8 }}
                disabled={pending || !pretAImporter}
              >
                {pending
                  ? "Import en cours…"
                  : `Importer ${rows.length} produit${rows.length > 1 ? "s" : ""}`}
              </button>
            </>
          ) : null}

          {state?.error ? (
            <div className="note" style={{ color: "var(--danger)" }}>
              {state.error}
            </div>
          ) : null}
          {state?.ok ? (
            <div className="calcbox" style={{ marginTop: 14 }}>
              <div className="calcline">
                <span>Produits créés</span>
                <span className="pos">{state.crees}</span>
              </div>
              <div className="calcline">
                <span>Produits mis à jour</span>
                <span>{state.maj}</span>
              </div>
              {state.ignores ? (
                <div className="calcline">
                  <span>Sans changement</span>
                  <span className="muted">{state.ignores}</span>
                </div>
              ) : null}
              <div className="calcline total">
                <span>Terminé</span>
                <span>
                  <Link href="/produits" className="lien">
                    Voir mes produits →
                  </Link>
                </span>
              </div>
            </div>
          ) : null}
        </form>
      </div>

      <div className="card">
        <h2>Aperçu — ce qui sera enregistré ({rows.length})</h2>
        {!charge ? (
          <div className="hint">
            Charge un fichier ou colle ta liste à gauche : l&apos;aperçu exact de ce qui sera
            enregistré apparaîtra ici.
          </div>
        ) : (
          <>
            <div className="hint">
              {resume.length > 0 ? (
                <>
                  Correspondance :{" "}
                  {resume.map((c, k) => (
                    <span key={c.champ}>
                      {k > 0 ? ", " : ""}
                      <strong>{LABELS[c.champ]}</strong> ← « {c.source} »
                    </span>
                  ))}
                  .
                  <br />
                </>
              ) : null}
              {nbNouveaux} nouveau{nbNouveaux > 1 ? "x" : ""}, {nbMaj} mise
              {nbMaj > 1 ? "s" : ""} à jour.
              {rows.length > 200
                ? ` (aperçu des 200 premiers ; les ${rows.length} seront importés)`
                : ""}
              <br />
              Une case vide n&apos;est pas touchée ; le{" "}
              <strong>stock d&apos;un produit déjà connu n&apos;est jamais écrasé</strong> par
              l&apos;import.
            </div>
            {nbDoublons > 0 || nbSansPrix > 0 ? (
              <div className="note" style={{ color: "var(--accent)" }}>
                {nbDoublons > 0 ? `⚠ ${nbDoublons} nom(s) en double dans ta liste. ` : ""}
                {nbSansPrix > 0
                  ? `⚠ ${nbSansPrix} nouveau(x) produit(s) sans prix de vente — tu ne pourras pas les vendre tant que tu n'auras pas mis un prix.`
                  : ""}
              </div>
            ) : null}
            <table style={{ marginTop: 6 }}>
              <thead>
                <tr>
                  <th>Produit</th>
                  <th className="num">Achat</th>
                  <th className="num">Vente</th>
                  <th className="num">Stock</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="muted">
                      Aucune ligne lisible pour l&apos;instant — vérifie la correspondance des
                      colonnes à gauche.
                    </td>
                  </tr>
                ) : (
                  rows.slice(0, 200).map((r, i) => {
                    const maj = dejaLa.has(r.nom.toLowerCase());
                    const dup = (occurrences.get(r.nom.toLowerCase()) ?? 0) > 1;
                    const achatProvided =
                      r.prixAchat !== undefined || r.frais !== undefined;
                    const cout = (r.prixAchat ?? 0) + (r.frais ?? 0);
                    return (
                      <tr key={`${r.nom}-${i}`}>
                        <td className="prod">
                          {r.nom}
                          {dup ? (
                            <span className="badge bad" style={{ marginLeft: 8 }}>
                              en double
                            </span>
                          ) : null}
                        </td>
                        <td className="num">
                          {achatProvided ? formatCFA(cout) : maj ? "—" : formatCFA(0)}
                        </td>
                        <td className="num">
                          {r.prixVente !== undefined
                            ? formatCFA(r.prixVente)
                            : maj
                            ? "—"
                            : formatCFA(0)}
                        </td>
                        <td className="num">
                          {maj ? <span className="muted">inchangé</span> : r.stock ?? 0}
                        </td>
                        <td className="num">
                          {maj ? (
                            <span className="badge warn">mise à jour</span>
                          ) : (
                            <span className="badge ok">nouveau</span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </>
        )}
      </div>
    </div>
  );
}
