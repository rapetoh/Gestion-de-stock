"use client";

import { formatCFA } from "@/lib/money";
import type { Produit } from "@/lib/repo/produits";
import SubmitButton from "@/components/SubmitButton";
import { modifierProduit, supprimerProduit } from "./actions";

export default function ProduitRow({
  p,
  editing,
  onEdit,
  onClose,
}: {
  p: Produit;
  editing: boolean;
  onEdit: () => void;
  onClose: () => void;
}) {
  const marge = p.prix_vente - (p.prix_achat + p.frais);

  // Enregistre puis ferme l'éditeur (la sauvegarde est terminée quand l'action a résolu).
  async function enregistrer(formData: FormData) {
    await modifierProduit(formData);
    onClose();
  }

  if (editing) {
    return (
      <tr>
        <td colSpan={8}>
          <form action={enregistrer}>
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
          <button type="button" className="btn ghost" onClick={onEdit}>
            Modifier
          </button>
          <form
            action={supprimerProduit}
            onSubmit={(e) => {
              if (!confirm(`Supprimer « ${p.nom} » ? Cette action est définitive.`)) {
                e.preventDefault();
              }
            }}
          >
            <input type="hidden" name="id" value={p.id} />
            <button type="submit" className="btn danger">
              Supprimer
            </button>
          </form>
        </div>
      </td>
    </tr>
  );
}
