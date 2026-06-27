"use client";

import { useState } from "react";
import { formatCFA } from "@/lib/money";
import { jourCourt } from "@/lib/dates";
import type { Depense } from "@/lib/repo/depenses";
import { modifierDepense, supprimerDepense } from "./actions";
import { CATEGORIES } from "./categories";

export default function DepenseRow({ d }: { d: Depense }) {
  const [edit, setEdit] = useState(false);
  const dateJour = d.date.slice(0, 10);

  if (edit) {
    return (
      <tr>
        <td colSpan={5}>
          <form action={modifierDepense}>
            <input type="hidden" name="id" value={d.id} />
            <div className="row3" style={{ marginBottom: 12 }}>
              <div className="field" style={{ margin: 0 }}>
                <label>Libellé</label>
                <input className="input" name="libelle" defaultValue={d.libelle} />
              </div>
              <div className="field" style={{ margin: 0 }}>
                <label>Montant</label>
                <input
                  className="input"
                  name="montant"
                  defaultValue={d.montant}
                  inputMode="numeric"
                />
              </div>
              <div className="field" style={{ margin: 0 }}>
                <label>Catégorie</label>
                <select
                  className="input"
                  name="categorie"
                  defaultValue={d.categorie ?? "Autre"}
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="row2" style={{ marginBottom: 12 }}>
              <div className="field" style={{ margin: 0 }}>
                <label>Date</label>
                <input
                  className="input"
                  type="date"
                  name="date"
                  defaultValue={dateJour}
                />
              </div>
              <div className="field" style={{ margin: 0, justifyContent: "flex-end" }}>
                <label
                  style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}
                >
                  <input
                    type="checkbox"
                    name="recurrente"
                    defaultChecked={d.recurrente === 1}
                  />
                  Revient chaque mois
                </label>
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
      <td className="muted">{jourCourt(d.date)}</td>
      <td className="prod">
        {d.libelle}
        {d.recurrente === 1 ? (
          <span className="badge ok" style={{ marginLeft: 8 }}>
            chaque mois
          </span>
        ) : null}
      </td>
      <td>{d.categorie ?? "—"}</td>
      <td className="num neg">{formatCFA(d.montant)}</td>
      <td className="num">
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <button
            type="button"
            className="btn ghost"
            onClick={() => setEdit(true)}
          >
            Modifier
          </button>
          <form action={supprimerDepense}>
            <input type="hidden" name="id" value={d.id} />
            <button type="submit" className="btn ghost">
              Supprimer
            </button>
          </form>
        </div>
      </td>
    </tr>
  );
}
