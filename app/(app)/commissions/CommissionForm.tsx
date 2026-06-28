"use client";

import { useRef, useState } from "react";
import SubmitButton from "@/components/SubmitButton";
import { ajouterCommission } from "./actions";
import { CANAUX } from "./canaux";

function aujourdhui(): string {
  return new Date().toISOString().slice(0, 10); // YYYY-MM-DD (UTC = Lomé)
}

export default function CommissionForm() {
  const [date, setDate] = useState(aujourdhui);
  const [flash, setFlash] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  async function soumettre(formData: FormData) {
    const libelle = String(formData.get("libelle") ?? "").trim();
    if (!libelle) return;
    await ajouterCommission(formData);
    formRef.current?.reset();
    setDate(aujourdhui());
    setFlash(`Commission « ${libelle} » enregistrée ✓`);
  }

  return (
    <form ref={formRef} action={soumettre} onChange={() => flash && setFlash(null)}>
      <div className="field">
        <label>Quelle commission ?</label>
        <input
          className="input big"
          name="libelle"
          placeholder="ex : commissions TMoney du jour…"
          autoComplete="off"
          required
        />
      </div>

      <div className="row2">
        <div className="field">
          <label>Montant gagné</label>
          <input
            className="input big"
            name="montant"
            inputMode="numeric"
            placeholder="0"
          />
        </div>
        <div className="field">
          <label>Canal</label>
          <select className="input" name="canal" defaultValue="TMoney">
            {CANAUX.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      </div>

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

      <SubmitButton className="btn primary big" style={{ width: "100%" }}>
        Enregistrer la commission
      </SubmitButton>
      {flash ? (
        <div className="flash" style={{ display: "block" }}>
          {flash}
        </div>
      ) : (
        <div className="note">
          Les commissions du mois s&apos;ajoutent à ta marge réelle dans Bénéfices.
        </div>
      )}
    </form>
  );
}
