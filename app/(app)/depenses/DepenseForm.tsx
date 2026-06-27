"use client";

import { useRef, useState } from "react";
import SubmitButton from "@/components/SubmitButton";
import { ajouterDepense } from "./actions";
import { CATEGORIES } from "./categories";

function aujourdhui(): string {
  return new Date().toISOString().slice(0, 10); // YYYY-MM-DD
}

export default function DepenseForm() {
  const [date, setDate] = useState(aujourdhui);
  const [flash, setFlash] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  async function soumettre(formData: FormData) {
    const libelle = String(formData.get("libelle") ?? "").trim();
    if (!libelle) return;
    await ajouterDepense(formData);
    formRef.current?.reset();
    setDate(aujourdhui());
    setFlash(`Dépense « ${libelle} » enregistrée ✓`);
  }

  return (
    <form ref={formRef} action={soumettre} onChange={() => flash && setFlash(null)}>
      <div className="field">
        <label>Quelle dépense ?</label>
        <input
          className="input big"
          name="libelle"
          placeholder="ex : loyer de juin, salaire vendeuse…"
          autoComplete="off"
          required
        />
      </div>

      <div className="row2">
        <div className="field">
          <label>Montant</label>
          <input
            className="input big"
            name="montant"
            inputMode="numeric"
            placeholder="0"
          />
        </div>
        <div className="field">
          <label>Catégorie</label>
          <select className="input" name="categorie" defaultValue="Loyer">
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="row2">
        <div className="field">
          <label>Date</label>
          <input
            className="input"
            type="date"
            name="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>
        <div className="field" style={{ justifyContent: "flex-end" }}>
          <label
            style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}
          >
            <input type="checkbox" name="recurrente" />
            Revient chaque mois
          </label>
        </div>
      </div>

      <SubmitButton className="btn primary big" style={{ width: "100%" }}>
        Enregistrer la dépense
      </SubmitButton>
      {flash ? (
        <div className="flash" style={{ display: "block" }}>
          {flash}
        </div>
      ) : (
        <div className="note">
          Les dépenses du mois se retirent de ta marge pour donner ton gain réel.
        </div>
      )}
    </form>
  );
}
