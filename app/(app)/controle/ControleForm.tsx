"use client";

import { useMemo, useState } from "react";
import { formatCFA } from "@/lib/money";
import type { Produit } from "@/lib/repo/produits";
import { enregistrerControleAction } from "./actions";

export default function ControleForm({ produits }: { produits: Produit[] }) {
  const [recherche, setRecherche] = useState("");
  // produitId -> quantité comptée (texte). Vide = pas encore compté (on ignore).
  const [comptes, setComptes] = useState<Record<number, string>>({});

  function coutUnit(p: Produit) {
    return p.prix_achat + p.frais;
  }

  // Une ligne est "comptée" seulement si l'utilisatrice a tapé un nombre >= 0.
  const comptees = useMemo(() => {
    return produits
      .map((p) => {
        const brut = (comptes[p.id] ?? "").trim();
        if (brut === "") return null;
        const compte = Number(brut);
        if (!Number.isFinite(compte) || compte < 0) return null;
        const ecart = compte - p.stock;
        return { p, compte, ecart, valeur: ecart * coutUnit(p) };
      })
      .filter((x): x is NonNullable<typeof x> => x !== null);
  }, [comptes, produits]);

  const resume = useMemo(() => {
    let manque = 0;
    let surplus = 0;
    for (const c of comptees) {
      if (c.ecart < 0) manque += -c.valeur;
      else if (c.ecart > 0) surplus += c.valeur;
    }
    return { nb: comptees.length, manque, surplus };
  }, [comptees]);

  const visibles = useMemo(() => {
    const s = recherche.trim().toLowerCase();
    if (!s) return produits;
    return produits.filter((p) => p.nom.toLowerCase().includes(s));
  }, [recherche, produits]);

  const payload = JSON.stringify(
    comptees.map((c) => ({ produitId: c.p.id, compte: c.compte }))
  );

  function ecartBadge(ecart: number) {
    if (ecart < 0) return <span className="badge bad">manque {Math.abs(ecart)}</span>;
    if (ecart > 0) return <span className="badge warn">+{ecart} en trop</span>;
    return <span className="badge ok">ça tombe juste</span>;
  }

  return (
    <div
      className="grid"
      style={{ gridTemplateColumns: "1fr 360px", alignItems: "start" }}
    >
      <div className="card">
        <h2>Compter l&apos;étagère</h2>
        <div className="hint">
          Tape ce que tu comptes vraiment, produit par produit. Laisse vide ce
          que tu ne comptes pas aujourd&apos;hui — tu peux n&apos;en vérifier que
          quelques-uns.
        </div>

        <div className="field" style={{ marginTop: 10 }}>
          <input
            className="input big"
            value={recherche}
            onChange={(e) => setRecherche(e.target.value)}
            placeholder="Cherche un produit… ex : savon, eau"
            autoComplete="off"
          />
        </div>

        <table style={{ marginTop: 6 }}>
          <thead>
            <tr>
              <th>Produit</th>
              <th className="num">Théorique</th>
              <th className="num">Compté</th>
              <th className="num">Écart</th>
              <th className="num">Valeur</th>
            </tr>
          </thead>
          <tbody>
            {visibles.length === 0 ? (
              <tr>
                <td colSpan={5} className="muted">
                  Aucun produit trouvé.
                </td>
              </tr>
            ) : (
              visibles.map((p) => {
                const brut = (comptes[p.id] ?? "").trim();
                const compteValide =
                  brut !== "" && Number.isFinite(Number(brut)) && Number(brut) >= 0;
                const ecart = compteValide ? Number(brut) - p.stock : 0;
                return (
                  <tr key={p.id}>
                    <td className="prod">{p.nom}</td>
                    <td className="num muted">{p.stock}</td>
                    <td className="num">
                      <input
                        className="input"
                        style={{
                          width: 80,
                          padding: "6px 8px",
                          textAlign: "right",
                        }}
                        value={comptes[p.id] ?? ""}
                        inputMode="numeric"
                        placeholder="—"
                        onChange={(e) =>
                          setComptes((prev) => ({
                            ...prev,
                            [p.id]: e.target.value,
                          }))
                        }
                      />
                    </td>
                    <td className="num">{compteValide ? ecartBadge(ecart) : "—"}</td>
                    <td
                      className={`num ${
                        compteValide && ecart < 0 ? "neg" : ecart > 0 ? "pos" : ""
                      }`}
                    >
                      {compteValide && ecart !== 0
                        ? formatCFA(ecart * coutUnit(p))
                        : "—"}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <div className="card">
        <h2>Résultat du contrôle</h2>
        <div className="calcbox" style={{ marginTop: 8 }}>
          <div className="calcline">
            <span>Produits comptés</span>
            <span>{resume.nb}</span>
          </div>
          <div className="calcline">
            <span>En trop</span>
            <span className="pos">{formatCFA(resume.surplus)}</span>
          </div>
          <div className="calcline total">
            <span>Manque (vol/perte ?)</span>
            <span className="neg">{formatCFA(resume.manque)}</span>
          </div>
        </div>

        <form action={enregistrerControleAction} style={{ marginTop: 14 }}>
          <input type="hidden" name="lignes" value={payload} />
          <div className="field">
            <label>
              Note <span className="sub">(facultatif)</span>
            </label>
            <input
              className="input"
              name="note"
              autoComplete="off"
              placeholder="ex : contrôle avant départ employée"
            />
          </div>
          <button
            type="submit"
            className="btn primary big"
            style={{ width: "100%" }}
            disabled={resume.nb === 0}
          >
            Enregistrer le contrôle
          </button>
          <div className="note">
            Le stock se corrige avec ce que tu as compté. L&apos;écart reste
            gardé dans l&apos;historique.
          </div>
        </form>
      </div>
    </div>
  );
}
