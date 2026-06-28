"use client";

import { useActionState, useMemo, useState } from "react";
import Link from "next/link";
import { parseProduitsTexte } from "@/lib/import";
import { formatCFA } from "@/lib/money";
import { importerProduitsAction, type ImportState } from "../actions";

const EXEMPLE = `Nom;Prix de vente;Stock;Catégorie
Savon Paris amande;750;50;Cosmétique
Eau en sachet (paquet);500;100;Eau
Lait concentré (boîte);500;48;Alimentation`;

export default function ImportProduits({ existants }: { existants: string[] }) {
  const dejaLa = useMemo(
    () => new Set(existants.map((n) => n.toLowerCase())),
    [existants]
  );
  const [texte, setTexte] = useState("");
  const [state, formAction, pending] = useActionState<ImportState, FormData>(
    importerProduitsAction,
    null
  );

  const result = useMemo(() => parseProduitsTexte(texte), [texte]);
  const rows = result.rows;

  async function onFichier(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    // Lit le fichier comme texte (le BOM éventuel est géré par le parseur).
    const contenu = await f.text();
    setTexte(contenu);
    e.target.value = ""; // permet de re-choisir le même fichier
  }

  // Compte les noms en double DANS la liste collée (le dernier l'emporterait sinon).
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

  return (
    <div className="grid" style={{ gridTemplateColumns: "1fr 1fr", alignItems: "start" }}>
      <div className="card">
        <h2>Coller la liste ou choisir un fichier</h2>
        <div className="hint">
          Un produit par ligne. Le mieux : une <strong>première ligne d&apos;en-tête</strong>
          qui nomme tes colonnes (<em>Nom, Prix de vente, Stock, Catégorie…</em>) — dans
          l&apos;ordre que tu veux, tu mets seulement les colonnes que tu as. Séparateur
          <strong> ; </strong> ou tabulation (copier d&apos;Excel) ou virgule.
          <br />
          <strong>Seul le nom est obligatoire.</strong> Une case vide n&apos;est pas
          touchée (elle ne devient pas 0).
          <br />• <strong>Nouveau</strong> nom → produit créé.
          <br />• Nom <strong>déjà là</strong> → on met à jour seulement ce que tu as
          rempli. Le <strong>stock d&apos;un produit existant n&apos;est jamais modifié
          par l&apos;import</strong> (il se gère dans Achats / Ventes / Contrôle).
        </div>

        <div className="field" style={{ marginTop: 12, marginBottom: 4 }}>
          <label>
            Choisir un fichier <span className="sub">(.csv, .tsv, .txt — depuis Excel ou Sauvegarde)</span>
          </label>
          <input
            className="input"
            type="file"
            accept=".csv,.tsv,.txt,text/csv,text/tab-separated-values,text/plain"
            onChange={onFichier}
          />
        </div>

        <form action={formAction}>
          <textarea
            className="input"
            name="texte"
            value={texte}
            onChange={(e) => setTexte(e.target.value)}
            placeholder={EXEMPLE}
            rows={12}
            style={{ width: "100%", fontFamily: "monospace", marginTop: 10 }}
          />
          <div style={{ display: "flex", gap: 10, alignItems: "center", marginTop: 10 }}>
            <button
              type="submit"
              className="btn primary big"
              disabled={pending || rows.length === 0}
            >
              {pending ? "Import en cours…" : `Importer ${rows.length} produit${rows.length > 1 ? "s" : ""}`}
            </button>
            <button
              type="button"
              className="btn ghost"
              onClick={() => setTexte(EXEMPLE)}
            >
              Mettre un exemple
            </button>
          </div>
        </form>

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
      </div>

      <div className="card">
        <h2>Aperçu ({rows.length})</h2>
        <div className="hint">
          {nbNouveaux} nouveau{nbNouveaux > 1 ? "x" : ""}, {nbMaj} mise
          {nbMaj > 1 ? "s" : ""} à jour. Vérifie avant d&apos;importer.
          {rows.length > 200
            ? ` (aperçu des 200 premiers ; les ${rows.length} seront importés)`
            : ""}
          <br />
          {rows.length === 0
            ? null
            : result.avecEntete
            ? `Colonnes reconnues : ${result.colonnes.join(", ")}.`
            : "Aucun en-tête reconnu — colonnes lues dans l'ordre : Nom, Prix d'achat, Frais, Prix de vente, Stock, Seuil, Catégorie. (Astuce : ajoute une 1re ligne d'en-tête.)"}
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
                  Colle ta liste à gauche pour voir l&apos;aperçu ici.
                </td>
              </tr>
            ) : (
              rows.slice(0, 200).map((r, i) => {
                const maj = dejaLa.has(r.nom.toLowerCase());
                const dup = (occurrences.get(r.nom.toLowerCase()) ?? 0) > 1;
                const achatProvided = r.prixAchat !== undefined || r.frais !== undefined;
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
                      {maj ? (
                        <span className="muted">inchangé</span>
                      ) : (
                        r.stock ?? 0
                      )}
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
      </div>
    </div>
  );
}
