"use client";

import { formatCFA } from "@/lib/money";
import { jourCourt } from "@/lib/dates";
import type { Commission } from "@/lib/repo/commissions";
import SubmitButton from "@/components/SubmitButton";
import { modifierCommission, supprimerCommission } from "./actions";
import { CANAUX } from "./canaux";

export default function CommissionRow({
  c,
  editing,
  onEdit,
  onClose,
}: {
  c: Commission;
  editing: boolean;
  onEdit: () => void;
  onClose: () => void;
}) {
  const dateJour = c.date.slice(0, 10);

  async function enregistrer(formData: FormData) {
    await modifierCommission(formData);
    onClose();
  }

  if (editing) {
    return (
      <tr>
        <td colSpan={5}>
          <form action={enregistrer}>
            <input type="hidden" name="id" value={c.id} />
            <div className="row3" style={{ marginBottom: 12 }}>
              <div className="field" style={{ margin: 0 }}>
                <label>Libellé</label>
                <input className="input" name="libelle" defaultValue={c.libelle} />
              </div>
              <div className="field" style={{ margin: 0 }}>
                <label>Montant</label>
                <input
                  className="input"
                  name="montant"
                  defaultValue={c.montant}
                  inputMode="numeric"
                />
              </div>
              <div className="field" style={{ margin: 0 }}>
                <label>Canal</label>
                <select className="input" name="canal" defaultValue={c.canal ?? "Autre"}>
                  {CANAUX.map((x) => (
                    <option key={x} value={x}>
                      {x}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="row2" style={{ marginBottom: 12 }}>
              <div className="field" style={{ margin: 0 }}>
                <label>Date</label>
                <input className="input" type="date" name="date" defaultValue={dateJour} />
              </div>
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <SubmitButton className="btn primary">Enregistrer</SubmitButton>
              <button type="button" className="btn ghost" onClick={onClose}>
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
      <td className="muted">{jourCourt(c.date)}</td>
      <td className="prod">{c.libelle}</td>
      <td>{c.canal ?? "—"}</td>
      <td className="num pos">{formatCFA(c.montant)}</td>
      <td className="num">
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <button type="button" className="btn ghost" onClick={onEdit}>
            Modifier
          </button>
          <form
            action={supprimerCommission}
            onSubmit={(e) => {
              if (!confirm(`Supprimer la commission « ${c.libelle} » ? Cette action est définitive.`)) {
                e.preventDefault();
              }
            }}
          >
            <input type="hidden" name="id" value={c.id} />
            <button type="submit" className="btn danger">
              Supprimer
            </button>
          </form>
        </div>
      </td>
    </tr>
  );
}
