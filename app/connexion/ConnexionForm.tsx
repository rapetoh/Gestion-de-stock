"use client";

import { useActionState } from "react";
import { connexion, type ConnexionState } from "./actions";

const initial: ConnexionState = {};

export default function ConnexionForm() {
  const [state, formAction, pending] = useActionState(connexion, initial);

  return (
    <form action={formAction}>
      <h2 style={{ marginBottom: 16 }}>Se connecter</h2>

      {state.error ? (
        <div
          className="badge bad"
          style={{ display: "block", marginBottom: 16, padding: "10px 12px" }}
        >
          {state.error}
        </div>
      ) : null}

      <div className="field">
        <label htmlFor="login">Identifiant</label>
        <input
          id="login"
          name="login"
          className="input"
          autoComplete="username"
          autoFocus
        />
      </div>

      <div className="field">
        <label htmlFor="motDePasse">Mot de passe</label>
        <input
          id="motDePasse"
          name="motDePasse"
          type="password"
          className="input"
          autoComplete="current-password"
        />
      </div>

      <button
        type="submit"
        className="btn primary big"
        style={{ width: "100%" }}
        disabled={pending}
      >
        {pending ? "Connexion…" : "Se connecter"}
      </button>
    </form>
  );
}
