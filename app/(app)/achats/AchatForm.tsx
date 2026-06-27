"use client";

import { useMemo, useState } from "react";
import { formatCFA, parseCFA, coutDeRevientUnitaire } from "@/lib/money";
import type { Produit } from "@/lib/repo/produits";
import SubmitButton from "@/components/SubmitButton";
import { enregistrerAchat } from "./actions";

export default function AchatForm({ produits }: { produits: Produit[] }) {
  const [nom, setNom] = useState("");
  const [quantite, setQuantite] = useState("1");
  const [prixAchat, setPrixAchat] = useState("0");
  const [frais, setFrais] = useState("0");
  const [prixVente, setPrixVente] = useState("0");
  const [flash, setFlash] = useState<string | null>(null);

  async function soumettre(formData: FormData) {
    const n = nom.trim();
    if (!n) return;
    await enregistrerAchat(formData);
    setNom("");
    setQuantite("1");
    setPrixAchat("0");
    setFrais("0");
    setPrixVente("0");
    setFlash(`Achat de « ${n} » enregistré ✓`);
  }

  // Pré-remplissage si le nom correspond à un produit existant.
  function onNomChange(v: string) {
    setNom(v);
    const found = produits.find(
      (p) => p.nom.toLowerCase() === v.trim().toLowerCase()
    );
    if (found) {
      setPrixAchat(String(found.prix_achat));
      setPrixVente(String(found.prix_vente));
    }
  }

  const calc = useMemo(() => {
    const q = parseCFA(quantite);
    const pa = parseCFA(prixAchat);
    const fr = parseCFA(frais);
    const pv = parseCFA(prixVente);
    const cout = coutDeRevientUnitaire(pa, fr, q);
    const marge = pv - cout;
    return { cout, marge, pv };
  }, [quantite, prixAchat, frais, prixVente]);

  return (
    <form action={soumettre} onChange={() => flash && setFlash(null)}>
      <div className="field">
        <label>Produit</label>
        <input
          className="input big"
          name="nom"
          list="liste-produits"
          value={nom}
          onChange={(e) => onNomChange(e.target.value)}
          placeholder="Tape le nom du produit…"
          autoComplete="off"
          required
        />
        <datalist id="liste-produits">
          {produits.map((p) => (
            <option key={p.id} value={p.nom} />
          ))}
        </datalist>
      </div>

      <div className="row2">
        <div className="field">
          <label>Quantité reçue</label>
          <input
            className="input big"
            name="quantite"
            value={quantite}
            onChange={(e) => setQuantite(e.target.value)}
            inputMode="numeric"
          />
        </div>
        <div className="field">
          <label>
            Prix d&apos;achat <span className="sub">(par unité)</span>
          </label>
          <input
            className="input big"
            name="prixAchat"
            value={prixAchat}
            onChange={(e) => setPrixAchat(e.target.value)}
            inputMode="numeric"
          />
        </div>
      </div>

      <div className="field">
        <label>
          Frais de transport <span className="sub">(pour tout le lot)</span>
        </label>
        <input
          className="input"
          name="frais"
          value={frais}
          onChange={(e) => setFrais(e.target.value)}
          inputMode="numeric"
        />
      </div>

      <div className="calcbox">
        <div className="calcline">
          <span>Coût de revient (par unité)</span>
          <span>{formatCFA(calc.cout)}</span>
        </div>
        <div className="calcline">
          <span>Ta marge</span>
          <span>
            {calc.marge >= 0 ? "+ " : "− "}
            {formatCFA(Math.abs(calc.marge))}
          </span>
        </div>
        <div className="calcline total">
          <span>Prix de vente</span>
          <span>{formatCFA(calc.pv)}</span>
        </div>
      </div>

      <div className="field">
        <label>
          Prix de vente <span className="sub">(tu peux le changer)</span>
        </label>
        <input
          className="input big"
          name="prixVente"
          value={prixVente}
          onChange={(e) => setPrixVente(e.target.value)}
          inputMode="numeric"
        />
      </div>

      <div className="field">
        <label>
          Fournisseur <span className="sub">(facultatif)</span>
        </label>
        <input className="input" name="fournisseur" autoComplete="off" />
      </div>

      <SubmitButton className="btn primary big" style={{ width: "100%" }}>
        Enregistrer l&apos;achat
      </SubmitButton>
      {flash ? (
        <div className="flash" style={{ display: "block" }}>
          {flash}
        </div>
      ) : (
        <div className="note">
          Le stock augmente tout seul. Tu pourras toujours modifier après.
        </div>
      )}
    </form>
  );
}
