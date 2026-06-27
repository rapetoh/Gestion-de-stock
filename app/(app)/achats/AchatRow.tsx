"use client";

import { useState } from "react";
import { formatCFA } from "@/lib/money";
import { jourCourt } from "@/lib/dates";
import type { AchatAvecProduit } from "@/lib/repo/achats";
import { modifierAchat, supprimerAchat } from "./actions";

export default function AchatRow({ a }: { a: AchatAvecProduit }) {
  const [edit, setEdit] = useState(false);

  if (edit) {
    return (
      <tr>
        <td colSpan={7}>
          <form action={modifierAchat}>
            <input type="hidden" name="id" value={a.id} />
            <div className="hint" style={{ marginBottom: 10 }}>
              {a.nom} — modifie ce qui est faux, puis enregistre. Le stock se
              corrige tout seul.
            </div>
            <div className="row3" style={{ marginBottom: 12 }}>
              <div className="field" style={{ margin: 0 }}>
                <label>Quantité reçue</label>
                <input
                  className="input"
                  name="quantite"
                  defaultValue={a.quantite}
                  inputMode="numeric"
                />
              </div>
              <div className="field" style={{ margin: 0 }}>
                <label>Prix d&apos;achat (par unité)</label>
                <input
                  className="input"
                  name="prixAchat"
                  defaultValue={a.prix_achat}
                  inputMode="numeric"
                />
              </div>
              <div className="field" style={{ margin: 0 }}>
                <label>Frais (tout le lot)</label>
                <input
                  className="input"
                  name="frais"
                  defaultValue={a.frais}
                  inputMode="numeric"
                />
              </div>
            </div>
            <div className="row2" style={{ marginBottom: 12 }}>
              <div className="field" style={{ margin: 0 }}>
                <label>Prix de vente</label>
                <input
                  className="input"
                  name="prixVente"
                  defaultValue={a.prix_vente}
                  inputMode="numeric"
                />
              </div>
              <div className="field" style={{ margin: 0 }}>
                <label>
                  Fournisseur <span className="sub">(facultatif)</span>
                </label>
                <input
                  className="input"
                  name="fournisseur"
                  defaultValue={a.fournisseur ?? ""}
                  autoComplete="off"
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
      <td className="muted">{jourCourt(a.date)}</td>
      <td className="prod">{a.nom}</td>
      <td className="num">{a.quantite}</td>
      <td className="num">{formatCFA(a.prix_achat)}</td>
      <td className="num">{formatCFA(a.frais)}</td>
      <td className="num">{formatCFA(a.prix_vente)}</td>
      <td className="num">
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <button
            type="button"
            className="btn ghost"
            onClick={() => setEdit(true)}
          >
            Modifier
          </button>
          <form action={supprimerAchat}>
            <input type="hidden" name="id" value={a.id} />
            <button type="submit" className="btn ghost">
              Supprimer
            </button>
          </form>
        </div>
      </td>
    </tr>
  );
}
