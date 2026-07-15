"use client";

import { useEffect, useMemo, useState } from "react";
import { formatCFA } from "@/lib/money";
import SubmitButton from "@/components/SubmitButton";
import { enregistrerControleAction } from "./actions";
import { rechercherPourAchat } from "../produits/recherche";

type Ligne = { id: number; nom: string; stock: number; cout: number };

export default function ControleForm() {
  const [recherche, setRecherche] = useState("");
  const [resultats, setResultats] = useState<Ligne[]>([]);
  // produitId -> quantité comptée (texte). Vide = pas encore compté (on ignore).
  const [comptes, setComptes] = useState<Record<number, string>>({});
  // On retient les infos des produits rencontrés, pour garder une ligne comptée visible hors recherche.
  const [connus, setConnus] = useState<Record<number, Ligne>>({});
  const [flash, setFlash] = useState<string | null>(null);

  // Recherche serveur débouncée (pas tout le catalogue dans la page).
  useEffect(() => {
    const s = recherche.trim();
    let annule = false;
    const t = setTimeout(async () => {
      if (!s) {
        if (!annule) setResultats([]);
        return;
      }
      const res = await rechercherPourAchat(s);
      if (annule) return;
      const lignes: Ligne[] = res.map((p) => ({
        id: p.id,
        nom: p.nom,
        stock: p.stock,
        cout: p.prix_achat + p.frais,
      }));
      setResultats(lignes);
      setConnus((prev) => {
        const n = { ...prev };
        for (const l of lignes) n[l.id] = l;
        return n;
      });
    }, s ? 180 : 0);
    return () => {
      annule = true;
      clearTimeout(t);
    };
  }, [recherche]);

  // Produits affichés = résultats de recherche + ceux déjà comptés (pour ne pas les perdre de vue).
  const visibles = useMemo(() => {
    const map = new Map<number, Ligne>();
    for (const l of resultats) map.set(l.id, l);
    for (const idStr of Object.keys(comptes)) {
      const id = Number(idStr);
      if ((comptes[id] ?? "").trim() !== "" && !map.has(id) && connus[id]) {
        map.set(id, connus[id]);
      }
    }
    return [...map.values()];
  }, [resultats, comptes, connus]);

  const comptees = useMemo(() => {
    return Object.keys(comptes)
      .map((idStr) => {
        const id = Number(idStr);
        const brut = (comptes[id] ?? "").trim();
        if (brut === "") return null;
        const compte = Number(brut);
        const info = connus[id];
        if (!Number.isFinite(compte) || compte < 0 || !info) return null;
        const ecart = compte - info.stock;
        return { id, nom: info.nom, compte, ecart, valeur: ecart * info.cout };
      })
      .filter((x): x is NonNullable<typeof x> => x !== null);
  }, [comptes, connus]);

  const resume = useMemo(() => {
    let manque = 0;
    let surplus = 0;
    for (const c of comptees) {
      if (c.ecart < 0) manque += -c.valeur;
      else if (c.ecart > 0) surplus += c.valeur;
    }
    return { nb: comptees.length, manque, surplus };
  }, [comptees]);

  const payload = JSON.stringify(
    comptees.map((c) => ({ produitId: c.id, compte: c.compte }))
  );

  async function soumettre(formData: FormData) {
    if (!comptees.length) return;
    const m = resume.manque;
    await enregistrerControleAction(formData);
    setComptes({});
    setResultats([]);
    setRecherche("");
    setFlash(
      m > 0
        ? `Contrôle enregistré ✓ : manque de ${formatCFA(m)}`
        : "Contrôle enregistré ✓ : tout est juste"
    );
  }

  function ecartBadge(ecart: number) {
    if (ecart < 0) return <span className="badge bad">manque {Math.abs(ecart)}</span>;
    if (ecart > 0) return <span className="badge warn">+{ecart} en trop</span>;
    return <span className="badge ok">ça tombe juste</span>;
  }

  return (
    <div className="grid" style={{ gridTemplateColumns: "1fr 360px", alignItems: "start" }}>
      <div className="card">
        <h2>Compter l&apos;étagère</h2>
        <div className="hint">
          Cherche un produit, tape ce que tu comptes vraiment. Tu peux n&apos;en
          vérifier que quelques-uns : ceux que tu as comptés restent affichés.
        </div>

        <div className="field" style={{ marginTop: 10 }}>
          <input
            className="input big"
            value={recherche}
            onChange={(e) => setRecherche(e.target.value)}
            // Douchette : Entrée ne doit pas soumettre le contrôle en cours.
            onKeyDown={(e) => { if (e.key === "Enter") e.preventDefault(); }}
            placeholder="Cherche un produit… ou scanne le code-barres"
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
                  Cherche un produit pour commencer à compter.
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
                        style={{ width: 80, padding: "6px 8px", textAlign: "right" }}
                        value={comptes[p.id] ?? ""}
                        inputMode="numeric"
                        placeholder="-"
                        onChange={(e) =>
                          setComptes((prev) => ({ ...prev, [p.id]: e.target.value }))
                        }
                      />
                    </td>
                    <td className="num">{compteValide ? ecartBadge(ecart) : "-"}</td>
                    <td
                      className={`num ${
                        compteValide && ecart < 0 ? "neg" : ecart > 0 ? "pos" : ""
                      }`}
                    >
                      {compteValide && ecart !== 0 ? formatCFA(ecart * p.cout) : "-"}
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

        <form action={soumettre} style={{ marginTop: 14 }}>
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
          <SubmitButton
            className="btn primary big"
            style={{ width: "100%" }}
            disabled={resume.nb === 0}
          >
            Enregistrer le contrôle
          </SubmitButton>
          {flash ? (
            <div className="flash" style={{ display: "block" }}>
              {flash}
            </div>
          ) : (
            <div className="note">
              Le stock se corrige avec ce que tu as compté. L&apos;écart reste
              gardé dans l&apos;historique.
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
