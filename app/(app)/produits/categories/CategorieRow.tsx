"use client";

import { useState } from "react";
import type { Categorie } from "@/lib/repo/categories";
import SubmitButton from "@/components/SubmitButton";
import { renommerCategorieAction, supprimerCategorieAction } from "./actions";

export default function CategorieRow({ c }: { c: Categorie }) {
  const [edition, setEdition] = useState(false);

  if (edition) {
    return (
      <tr>
        <td colSpan={3}>
          <form
            action={async (fd) => {
              await renommerCategorieAction(fd);
              setEdition(false);
            }}
            style={{ display: "flex", gap: 10, alignItems: "center" }}
          >
            <input type="hidden" name="id" value={c.id} />
            <input className="input" name="nom" defaultValue={c.nom} autoComplete="off" />
            <SubmitButton className="btn primary">Renommer</SubmitButton>
            <button type="button" className="btn ghost" onClick={() => setEdition(false)}>
              Annuler
            </button>
          </form>
          {c.nbProduits > 0 ? (
            <div className="sub" style={{ marginTop: 6 }}>
              Le nouveau nom sera appliqué aux {c.nbProduits} produit
              {c.nbProduits > 1 ? "s" : ""} de cette catégorie.
            </div>
          ) : null}
        </td>
      </tr>
    );
  }

  return (
    <tr>
      <td className="prod">{c.nom}</td>
      <td className="num">
        {c.nbProduits > 0 ? (
          c.nbProduits
        ) : (
          <span className="muted">aucun</span>
        )}
      </td>
      <td className="num">
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <button type="button" className="btn ghost" onClick={() => setEdition(true)}>
            Renommer
          </button>
          <form
            action={supprimerCategorieAction}
            onSubmit={(e) => {
              const msg =
                c.nbProduits > 0
                  ? `Supprimer « ${c.nom} » ? ${c.nbProduits} produit${c.nbProduits > 1 ? "s" : ""} perdront cette catégorie (les produits eux-mêmes ne bougent pas).`
                  : `Supprimer la catégorie « ${c.nom} » ?`;
              if (!confirm(msg)) e.preventDefault();
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
