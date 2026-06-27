"use client";

import { useState } from "react";
import { formatCFA } from "@/lib/money";
import type { Produit } from "@/lib/repo/produits";
import { modifierProduit, supprimerProduit } from "./actions";

export default function ProduitRow({ p }: { p: Produit }) {
  const [edit, setEdit] = useState(false);
  const marge = p.prix_vente - (p.prix_achat + p.frais);

  if (edit) {
    return (
      <tr>
        <td colSpan={8}>
          <form action={modifierProduit}>
            <input type="hidden" name="id" value={p.id} />
            <div className="row3" style={{ marginBottom: 12 }}>
              <div className="field" style={{ margin: 0 }}>
                <label>Nom</label>
                <input className="input" name="nom" defaultValue={p.nom} />
              </div>
              <div className="field" style={{ margin: 0 }}>
                <label>Catégorie</label>
                <input
                  className="input"
                  name="categorie"
                  defaultValue={p.categorie ?? ""}
                />
              </div>
              <div className="field" style={{ margin: 0 }}>
                <label>Stock</label>
                <input
                  className="input"
                  name="stock"
                  defaultValue={p.stock}
                  inputMode="numeric"
                />
              </div>
            </div>
            <div className="row3" style={{ marginBottom: 12 }}>
              <div className="field" style={{ margin: 0 }}>
                <label>Prix d&apos;achat</label>
                <input
                  className="input"
                  name="prixAchat"
                  defaultValue={p.prix_achat}
                  inputMode="numeric"
                />
              </div>
              <div className="field" style={{ margin: 0 }}>
                <label>Frais (unitaire)</label>
                <input
                  className="input"
                  name="frais"
                  defaultValue={p.frais}
                  inputMode="numeric"
                />
              </div>
              <div className="field" style={{ margin: 0 }}>
                <label>Prix de vente</label>
                <input
                  className="input"
                  name="prixVente"
                  defaultValue={p.prix_vente}
                  inputMode="numeric"
                />
              </div>
            </div>
            <div className="row2" style={{ marginBottom: 12 }}>
              <div className="field" style={{ margin: 0 }}>
                <label>Seuil de stock</label>
                <input
                  className="input"
                  name="seuilStock"
                  defaultValue={p.seuil_stock}
                  inputMode="numeric"
                />
              </div>
              <div className="field" style={{ margin: 0 }}>
                <label>
                  Code-barres <span className="sub">(facultatif)</span>
                </label>
                <input
                  className="input"
                  name="codeBarre"
                  defaultValue={p.code_barre ?? ""}
                />
              </div>
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button type="submit" className="btn primary">
                Enregistrer
              </button>
              <button
                type="button"
                className="btn ghost"
                onClick={() => setEdit(false)}
              >
                Annuler
              </button>
            </div>
          </form>
        </td>
      </tr>
    );
  }

  return (
    <tr>
      <td className="prod">{p.nom}</td>
      <td className="muted">{p.categorie ?? "—"}</td>
      <td className="num">{p.stock}</td>
      <td className="num">{formatCFA(p.prix_achat)}</td>
      <td className="num">{formatCFA(p.frais)}</td>
      <td className="num">{formatCFA(p.prix_vente)}</td>
      <td className={`num ${marge >= 0 ? "pos" : "neg"}`}>
        {marge >= 0 ? "+" : ""}
        {formatCFA(marge)}
      </td>
      <td className="num">
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <button
            type="button"
            className="btn ghost"
            onClick={() => setEdit(true)}
          >
            Modifier
          </button>
          <form action={supprimerProduit}>
            <input type="hidden" name="id" value={p.id} />
            <button type="submit" className="btn ghost">
              Supprimer
            </button>
          </form>
        </div>
      </td>
    </tr>
  );
}
