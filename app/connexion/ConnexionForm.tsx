"use client";

import { useActionState, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { connexion, type ConnexionState } from "./actions";

const initial: ConnexionState = {};

export default function ConnexionForm() {
  const [state, formAction, pending] = useActionState(connexion, initial);
  // L'œil montre ou cache le mot de passe pendant la frappe : sur téléphone,
  // taper à l'aveugle est la première cause de « je n'arrive pas à me connecter ».
  const [visible, setVisible] = useState(false);

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
        <div className="mdp-champ">
          <input
            id="motDePasse"
            name="motDePasse"
            type={visible ? "text" : "password"}
            className="input"
            autoComplete="current-password"
          />
          <button
            type="button"
            className="mdp-oeil"
            onClick={() => setVisible((v) => !v)}
            aria-label={visible ? "Cacher le mot de passe" : "Voir le mot de passe"}
            title={visible ? "Cacher le mot de passe" : "Voir le mot de passe"}
          >
            {visible ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
        </div>
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
