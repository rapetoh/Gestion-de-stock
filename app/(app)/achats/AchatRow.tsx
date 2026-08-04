"use client";

import { formatCFA } from "@/lib/money";
import { jourCourt } from "@/lib/dates";
import type { AchatAvecProduit } from "@/lib/repo/achats";
import SubmitButton from "@/components/SubmitButton";
import { modifierAchat, supprimerAchat } from "./actions";

// Une entrée du journal des achats, comme une ligne de cahier :
// ligne 1 = le nom complet (jamais tronqué), ligne 2 = toute l'histoire de l'achat.
export default function AchatRow({
  a,
  editing,
  onEdit,
  onClose,
}: {
  a: AchatAvecProduit;
  editing: boolean;
  onEdit: () => void;
  onClose: () => void;
}) {
  async function enregistrer(formData: FormData) {
    await modifierAchat(formData);
    onClose();
  }

  if (editing) {
    return (
      <div className="achat-item achat-edit">
        <form action={enregistrer} style={{ width: "100%" }}>
          <input type="hidden" name="id" value={a.id} />
          <div className="hint" style={{ marginBottom: 10 }}>
            {a.nom} : modifie ce qui est faux, puis enregistre. Le stock se
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
              <label>Frais de transport</label>
              <input
                className="input"
                name="frais"
                defaultValue={a.frais}
                inputMode="numeric"
              />
              <div className="frais-mode">
                <label>
                  <input type="radio" name="fraisMode" value="lot" defaultChecked /> pour
                  tout le lot
                </label>
                <label>
                  <input type="radio" name="fraisMode" value="unite" /> par unité
                </label>
              </div>
            </div>
          </div>
          <div className="row3" style={{ marginBottom: 12 }}>
            <div className="field" style={{ margin: 0 }}>
              <label>Date de l&apos;achat</label>
              <input
                className="input"
                type="date"
                name="jour"
                defaultValue={a.date.slice(0, 10)}
              />
            </div>
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
          <div style={{ marginBottom: 12 }}></div>
          <div style={{ display: "flex", gap: 10 }}>
            <SubmitButton className="btn primary">Enregistrer</SubmitButton>
            <button type="button" className="btn ghost" onClick={onClose}>
              Annuler
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="achat-item">
      <div className="achat-main">
        <div className="achat-nom">{a.nom}</div>
        <div className="achat-detail">
          <span>{jourCourt(a.date)}</span>
          <span>
            {a.quantite} × {formatCFA(a.prix_achat)}
          </span>
          {a.frais > 0 ? <span>+ {formatCFA(a.frais)} de frais</span> : null}
          <span>vend à {formatCFA(a.prix_vente)}</span>
          {a.fournisseur ? <span>({a.fournisseur})</span> : null}
        </div>
      </div>
      <div className="achat-actions">
        <button type="button" className="btn ghost" onClick={onEdit}>
          Modifier
        </button>
        <form
          action={supprimerAchat}
          onSubmit={(e) => {
            if (!confirm(`Supprimer cet achat de « ${a.nom} » ? Cette action est définitive.`)) {
              e.preventDefault();
            }
          }}
        >
          <input type="hidden" name="id" value={a.id} />
          <button type="submit" className="btn danger">
            Supprimer
          </button>
        </form>
      </div>
    </div>
  );
}
