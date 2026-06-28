"use client";

import { useActionState } from "react";
import { ajouterVendeuse, type EquipeState } from "./actions";

const initial: EquipeState = {};

export default function EquipeForm() {
  const [state, formAction, pending] = useActionState(ajouterVendeuse, initial);

  return (
    <form action={formAction}>
      {state.error ? (
        <div className="badge bad" style={{ display: "block", marginBottom: 12, padding: "10px 12px" }}>
          {state.error}
        </div>
      ) : null}
      {state.ok ? (
        <div className="flash" style={{ display: "block", marginBottom: 12 }}>
          {state.ok}
        </div>
      ) : null}

      <div className="field">
        <label>Nom de la personne</label>
        <input className="input big" name="nom" placeholder="ex : Akossiwa" autoComplete="off" required />
      </div>

      <div className="row2">
        <div className="field">
          <label>Identifiant (pour se connecter)</label>
          <input className="input" name="login" placeholder="ex : akossiwa" autoComplete="off" required />
        </div>
        <div className="field">
          <label>Mot de passe</label>
          <input className="input" name="motDePasse" type="text" placeholder="au moins 4 caractères" autoComplete="off" required />
        </div>
      </div>

      <button type="submit" className="btn primary big" style={{ width: "100%" }} disabled={pending}>
        {pending ? "Création…" : "Créer le compte vendeuse"}
      </button>
      <div className="note">
        Elle pourra encaisser les ventes et voir le stock — mais pas les marges,
        l&apos;argent, ni supprimer une vente. Chaque vente portera son nom.
      </div>
    </form>
  );
}
