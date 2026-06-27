"use client";

import { useState } from "react";
import { formatCFA } from "@/lib/money";
import type { VenteAvecLignes, Paiement } from "@/lib/repo/ventes";
import { modifierVente, supprimerVente } from "./actions";

const PAY: { id: Paiement; label: string }[] = [
  { id: "especes", label: "Espèces" },
  { id: "tmoney", label: "TMoney" },
  { id: "flooz", label: "Flooz" },
  { id: "credit", label: "Crédit" },
];

export default function VenteRow({
  v,
  heureLabel,
}: {
  v: VenteAvecLignes;
  heureLabel: string;
}) {
  const [edit, setEdit] = useState(false);
  const [paiement, setPaiement] = useState<Paiement>(v.paiement);
  const [qtes, setQtes] = useState<Record<number, number>>(
    Object.fromEntries(v.lignes.map((l) => [l.id, l.quantite]))
  );

  if (edit) {
    const payload = JSON.stringify(
      v.lignes.map((l) => ({ ligneId: l.id, quantite: qtes[l.id] ?? 0 }))
    );
    const nouveauTotal = v.lignes.reduce(
      (s, l) => s + l.prix_unitaire * (qtes[l.id] ?? 0),
      0
    );

    return (
      <tr>
        <td colSpan={5}>
          <form action={modifierVente}>
            <input type="hidden" name="id" value={v.id} />
            <input type="hidden" name="paiement" value={paiement} />
            <input type="hidden" name="lignes" value={payload} />

            <div className="hint" style={{ marginBottom: 10 }}>
              Corrige les quantités (mets 0 pour retirer un produit) ou le mode
              de paiement. Le stock se réajuste tout seul.
            </div>

            <table style={{ marginBottom: 12 }}>
              <thead>
                <tr>
                  <th>Produit</th>
                  <th className="num">Qté</th>
                  <th className="num">Prix</th>
                  <th className="num">Total</th>
                </tr>
              </thead>
              <tbody>
                {v.lignes.map((l) => (
                  <tr key={l.id}>
                    <td className="prod">{l.nom_produit}</td>
                    <td className="num">
                      <input
                        className="input"
                        style={{
                          width: 70,
                          padding: "6px 8px",
                          textAlign: "right",
                        }}
                        value={qtes[l.id] ?? 0}
                        inputMode="numeric"
                        onChange={(e) =>
                          setQtes((prev) => ({
                            ...prev,
                            [l.id]: Number(e.target.value) || 0,
                          }))
                        }
                      />
                    </td>
                    <td className="num">{formatCFA(l.prix_unitaire)}</td>
                    <td className="num">
                      {formatCFA(l.prix_unitaire * (qtes[l.id] ?? 0))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="field" style={{ maxWidth: 240, marginBottom: 12 }}>
              <label>Payé comment ?</label>
              <select
                className="input"
                value={paiement}
                onChange={(e) => setPaiement(e.target.value as Paiement)}
              >
                {PAY.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <button type="submit" className="btn primary">
                Enregistrer ({formatCFA(nouveauTotal)})
              </button>
              <button
                type="button"
                className="btn ghost"
                onClick={() => {
                  setPaiement(v.paiement);
                  setQtes(
                    Object.fromEntries(v.lignes.map((l) => [l.id, l.quantite]))
                  );
                  setEdit(false);
                }}
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
      <td className="muted">{heureLabel}</td>
      <td>
        {v.lignes.map((l) => `${l.nom_produit} ×${l.quantite}`).join(", ")}
      </td>
      <td>
        <span className="badge pay">
          {PAY.find((p) => p.id === v.paiement)?.label ?? v.paiement}
        </span>
      </td>
      <td className="num">{formatCFA(v.total)}</td>
      <td className="num">
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <button
            type="button"
            className="btn ghost"
            onClick={() => setEdit(true)}
          >
            Modifier
          </button>
          <form action={supprimerVente}>
            <input type="hidden" name="id" value={v.id} />
            <button type="submit" className="btn ghost">
              Supprimer
            </button>
          </form>
        </div>
      </td>
    </tr>
  );
}
