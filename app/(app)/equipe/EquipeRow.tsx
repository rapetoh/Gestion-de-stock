"use client";

import { useState } from "react";
import type { Utilisateur } from "@/lib/repo/utilisateurs";
import SubmitButton from "@/components/SubmitButton";
import { basculerActif, reinitialiserMotDePasseAction } from "./actions";

export default function EquipeRow({ u }: { u: Utilisateur }) {
  const [resetOuvert, setResetOuvert] = useState(false);
  const estProprietaire = u.role === "proprietaire";

  return (
    <>
      <tr>
        <td className="prod">{u.nom}</td>
        <td className="muted">{u.login}</td>
        <td>
          <span className="badge pay">
            {estProprietaire ? "Propriétaire" : "Vendeuse"}
          </span>
        </td>
        <td>
          {u.actif ? (
            <span className="badge ok">actif</span>
          ) : (
            <span className="badge bad">désactivé</span>
          )}
        </td>
        <td className="num">
          {estProprietaire ? (
            <span className="muted">— (c&apos;est toi)</span>
          ) : (
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", flexWrap: "wrap" }}>
              <button type="button" className="btn ghost" onClick={() => setResetOuvert((v) => !v)}>
                Mot de passe
              </button>
              <form
                action={basculerActif}
                onSubmit={(e) => {
                  if (
                    u.actif &&
                    !confirm(`Désactiver le compte de ${u.nom} ? Elle ne pourra plus se connecter.`)
                  ) {
                    e.preventDefault();
                  }
                }}
              >
                <input type="hidden" name="id" value={u.id} />
                <input type="hidden" name="actif" value={u.actif} />
                <button type="submit" className={u.actif ? "btn danger" : "btn"}>
                  {u.actif ? "Désactiver" : "Réactiver"}
                </button>
              </form>
            </div>
          )}
        </td>
      </tr>
      {resetOuvert && !estProprietaire ? (
        <tr>
          <td colSpan={5}>
            <form
              action={reinitialiserMotDePasseAction}
              onSubmit={() => setResetOuvert(false)}
              style={{ display: "flex", gap: 10, alignItems: "flex-end" }}
            >
              <input type="hidden" name="id" value={u.id} />
              <div className="field" style={{ margin: 0 }}>
                <label>Nouveau mot de passe pour {u.nom}</label>
                <input
                  className="input"
                  name="motDePasse"
                  type="text"
                  minLength={4}
                  placeholder="au moins 4 caractères"
                  autoComplete="off"
                  required
                />
              </div>
              <SubmitButton className="btn primary">Changer</SubmitButton>
              <button type="button" className="btn ghost" onClick={() => setResetOuvert(false)}>
                Annuler
              </button>
            </form>
          </td>
        </tr>
      ) : null}
    </>
  );
}
