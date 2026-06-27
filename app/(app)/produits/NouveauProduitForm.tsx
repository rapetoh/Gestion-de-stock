"use client";

import { useRef, useState } from "react";
import SubmitButton from "@/components/SubmitButton";
import { ajouterProduit } from "./actions";

export default function NouveauProduitForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [flash, setFlash] = useState<string | null>(null);

  async function ajouter(formData: FormData) {
    const nom = String(formData.get("nom") ?? "").trim();
    if (!nom) {
      setFlash(null);
      return;
    }
    await ajouterProduit(formData);
    formRef.current?.reset();
    setFlash(`« ${nom} » ajouté ✓`);
  }

  return (
    <form ref={formRef} action={ajouter} onChange={() => flash && setFlash(null)}>
      <div className="row3" style={{ marginBottom: 12 }}>
        <div className="field" style={{ margin: 0 }}>
          <label>Nom</label>
          <input className="input" name="nom" required />
        </div>
        <div className="field" style={{ margin: 0 }}>
          <label>Catégorie</label>
          <input className="input" name="categorie" />
        </div>
        <div className="field" style={{ margin: 0 }}>
          <label>Stock</label>
          <input className="input" name="stock" defaultValue="0" inputMode="numeric" />
        </div>
      </div>
      <div className="row3" style={{ marginBottom: 12 }}>
        <div className="field" style={{ margin: 0 }}>
          <label>Prix d&apos;achat</label>
          <input className="input" name="prixAchat" defaultValue="0" inputMode="numeric" />
        </div>
        <div className="field" style={{ margin: 0 }}>
          <label>Frais (unitaire)</label>
          <input className="input" name="frais" defaultValue="0" inputMode="numeric" />
        </div>
        <div className="field" style={{ margin: 0 }}>
          <label>Prix de vente</label>
          <input className="input" name="prixVente" defaultValue="0" inputMode="numeric" />
        </div>
      </div>
      <div className="row2" style={{ marginBottom: 12 }}>
        <div className="field" style={{ margin: 0 }}>
          <label>Seuil de stock</label>
          <input className="input" name="seuilStock" defaultValue="0" inputMode="numeric" />
        </div>
        <div className="field" style={{ margin: 0 }}>
          <label>
            Code-barres <span className="sub">(facultatif)</span>
          </label>
          <input className="input" name="codeBarre" />
        </div>
      </div>
      <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
        <SubmitButton className="btn primary big">Ajouter le produit</SubmitButton>
        {flash ? <span className="flash">{flash}</span> : null}
      </div>
    </form>
  );
}
