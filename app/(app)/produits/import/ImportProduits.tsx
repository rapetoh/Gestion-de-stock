"use client";

import { useActionState, useMemo, useState } from "react";
import Link from "next/link";
import { parseProduitsTexte } from "@/lib/import";
import { formatCFA } from "@/lib/money";
import { importerProduitsAction, type ImportState } from "../actions";

const EXEMPLE = `Savon Paris amande;450;30;750;50;5;Cosmétique
Eau en sachet (paquet);300;0;500;100;10;Eau
Lait concentré (boîte);350;40;500;48;6;Alimentation`;

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

  const rows = useMemo(() => parseProduitsTexte(texte), [texte]);
  const nbNouveaux = rows.filter((r) => !dejaLa.has(r.nom.toLowerCase())).length;
  const nbMaj = rows.length - nbNouveaux;

  return (
    <div className="grid" style={{ gridTemplateColumns: "1fr 1fr", alignItems: "start" }}>
      <div className="card">
        <h2>Coller la liste</h2>
        <div className="hint">
          Un produit par ligne, dans cet ordre, séparé par <strong>;</strong> (ou
          une tabulation si tu copies depuis Excel) :
          <br />
          <code>Nom ; Prix d&apos;achat ; Frais ; Prix de vente ; Stock ; Seuil ; Catégorie</code>
          <br />
          Seul le nom est obligatoire. Un nom qui existe déjà met le produit à
          jour (au lieu d&apos;en créer un nouveau).
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
        </div>
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
                return (
                  <tr key={`${r.nom}-${i}`}>
                    <td className="prod">{r.nom}</td>
                    <td className="num">{formatCFA(r.prixAchat + r.frais)}</td>
                    <td className="num">{formatCFA(r.prixVente)}</td>
                    <td className="num">{r.stock}</td>
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
