"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { formatCFA } from "@/lib/money";
import SubmitButton from "@/components/SubmitButton";
import { encaisserVente } from "./actions";
import { rechercherPourVente, type ProduitVente } from "../produits/recherche";

type Ligne = {
  produitId: number;
  nom: string;
  prix: number;
  quantite: number;
  stock: number; // stock connu au moment de l'ajout : pour avertir, jamais bloquer
};
type Paiement = "especes" | "tmoney" | "flooz" | "credit";

const PAY: { id: Paiement; ic: string; label: string }[] = [
  { id: "especes", ic: "💵", label: "Espèces" },
  { id: "tmoney", ic: "📲", label: "TMoney" },
  { id: "flooz", ic: "📲", label: "Flooz" },
  { id: "credit", ic: "⏳", label: "Crédit (plus tard)" },
];

export default function VenteCaisse() {
  const [recherche, setRecherche] = useState("");
  const [suggestions, setSuggestions] = useState<ProduitVente[]>([]);
  const [lignes, setLignes] = useState<Ligne[]>([]);
  const [paiement, setPaiement] = useState<Paiement>("especes");
  const [flash, setFlash] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  // Recherche serveur (débouncée) : on ne charge jamais tout le catalogue dans le téléphone.
  useEffect(() => {
    const s = recherche.trim();
    let annule = false;
    const t = setTimeout(async () => {
      if (!s) {
        if (!annule) setSuggestions([]);
        return;
      }
      const res = await rechercherPourVente(s);
      if (!annule) setSuggestions(res);
    }, s ? 180 : 0);
    return () => {
      annule = true;
      clearTimeout(t);
    };
  }, [recherche]);

  async function encaisser(formData: FormData) {
    if (!lignes.length) return;
    const montant = lignes.reduce((s, l) => s + l.prix * l.quantite, 0);
    await encaisserVente(formData);
    setLignes([]);
    setPaiement("especes");
    setRecherche("");
    setFlash(`Vente enregistrée ✓ : ${formatCFA(montant)}`);
  }

  // Douchette code-barres = clavier : elle « tape » le code puis envoie Entrée.
  // Entrée dans la recherche ne doit JAMAIS soumettre la vente : on cherche tout de
  // suite (sans attendre le debounce) et, si un seul produit correspond, on l'ajoute.
  async function surEntree(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key !== "Enter") return;
    e.preventDefault();
    const s = recherche.trim();
    if (!s) return;
    const res = await rechercherPourVente(s);
    if (res.length === 1) ajouter(res[0]);
    else setSuggestions(res);
  }

  function ajouter(p: ProduitVente) {
    setFlash(null);
    setLignes((prev) => {
      const existing = prev.find((l) => l.produitId === p.id);
      if (existing) {
        return prev.map((l) =>
          l.produitId === p.id ? { ...l, quantite: l.quantite + 1 } : l
        );
      }
      return [
        ...prev,
        { produitId: p.id, nom: p.nom, prix: p.prix_vente, quantite: 1, stock: p.stock },
      ];
    });
    setRecherche("");
  }

  function setQte(produitId: number, qte: number) {
    setLignes((prev) =>
      prev
        .map((l) => (l.produitId === produitId ? { ...l, quantite: qte } : l))
        .filter((l) => l.quantite > 0)
    );
  }

  function retirer(produitId: number) {
    setLignes((prev) => prev.filter((l) => l.produitId !== produitId));
  }

  const total = useMemo(
    () => lignes.reduce((s, l) => s + l.prix * l.quantite, 0),
    [lignes]
  );

  // Lignes où l'on vend plus que le stock connu : autorisé, mais signalé.
  const surventes = useMemo(
    () => lignes.filter((l) => l.quantite > l.stock),
    [lignes]
  );

  const payload = JSON.stringify(
    lignes.map((l) => ({ produitId: l.produitId, quantite: l.quantite }))
  );

  return (
    <div
      className="grid"
      style={{ gridTemplateColumns: "1fr 420px", alignItems: "start" }}
    >
      <div className="card">
        <div className="field" style={{ position: "relative" }}>
          <label>Quel produit ?</label>
          <input
            className="input big"
            value={recherche}
            onChange={(e) => setRecherche(e.target.value)}
            onKeyDown={surEntree}
            placeholder="Tape le nom… ou scanne le code-barres"
            autoComplete="off"
          />
          {suggestions.length > 0 ? (
            <div
              className="card"
              style={{
                position: "absolute",
                zIndex: 10,
                left: 0,
                right: 0,
                marginTop: 4,
                padding: 6,
              }}
            >
              {suggestions.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  className="nav-item"
                  style={{ width: "100%", justifyContent: "space-between" }}
                  onClick={() => ajouter(p)}
                >
                  <span>
                    {p.nom}{" "}
                    <span className={p.stock <= 0 ? "badge bad" : "muted"} style={{ fontSize: 12 }}>
                      {p.stock <= 0 ? "rupture" : `reste ${p.stock}`}
                    </span>
                  </span>
                  <span className="muted">{formatCFA(p.prix_vente)}</span>
                </button>
              ))}
            </div>
          ) : null}
        </div>

        <table style={{ marginTop: 6 }}>
          <thead>
            <tr>
              <th>Produit</th>
              <th className="num">Qté</th>
              <th className="num">Prix</th>
              <th className="num">Total</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {lignes.length === 0 ? (
              <tr>
                <td colSpan={5} className="muted">
                  Ajoute un produit pour commencer.
                </td>
              </tr>
            ) : (
              lignes.map((l) => (
                <tr key={l.produitId}>
                  <td className="prod">
                    {l.nom}
                    {l.quantite > l.stock ? (
                      <span className="badge warn" style={{ marginLeft: 8, fontSize: 12 }}>
                        {l.stock <= 0 ? "rupture" : `il reste ${l.stock}`}
                      </span>
                    ) : null}
                  </td>
                  <td className="num">
                    <input
                      className="input"
                      style={{ width: 70, padding: "6px 8px", textAlign: "right" }}
                      value={l.quantite}
                      inputMode="numeric"
                      onChange={(e) =>
                        setQte(l.produitId, Number(e.target.value) || 0)
                      }
                    />
                  </td>
                  <td className="num">{formatCFA(l.prix)}</td>
                  <td className="num">{formatCFA(l.prix * l.quantite)}</td>
                  <td className="num">
                    <button
                      type="button"
                      className="btn ghost"
                      onClick={() => retirer(l.produitId)}
                    >
                      Retirer
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="card">
        <h2>À encaisser</h2>
        <div className="calcbox" style={{ marginTop: 8 }}>
          <div className="calcline">
            <span>
              {lignes.length} produit{lignes.length > 1 ? "s" : ""}
            </span>
            <span>{formatCFA(total)}</span>
          </div>
          <div className="calcline total">
            <span>Total</span>
            <span>{formatCFA(total)}</span>
          </div>
        </div>

        <label
          style={{
            display: "block",
            fontWeight: 700,
            fontSize: 14,
            marginBottom: 9,
          }}
        >
          Payé comment ?
        </label>
        <div className="paygrid" style={{ marginBottom: paiement === "credit" ? 8 : 16 }}>
          {PAY.map((p) => (
            <button
              key={p.id}
              type="button"
              className={`payopt${paiement === p.id ? " sel" : ""}`}
              onClick={() => setPaiement(p.id)}
            >
              <span className="ic">{p.ic}</span> {p.label}
            </button>
          ))}
        </div>
        {paiement === "credit" ? (
          <div className="hint" style={{ marginBottom: 16 }}>
            Crédit : la marchandise sort et le gain est compté, mais l&apos;argent
            n&apos;est pas encore reçu. Note bien qui te doit.
          </div>
        ) : null}

        {surventes.length > 0 ? (
          <div
            className="hint"
            style={{ marginBottom: 10, borderLeft: "3px solid var(--warn, #e0a100)", paddingLeft: 10 }}
          >
            ⚠️ Tu vends plus que le stock pour{" "}
            <strong>{surventes.map((l) => l.nom).join(", ")}</strong>. La vente
            est permise : le stock passera en négatif (à vérifier au Contrôle de
            stock).
          </div>
        ) : null}

        <form ref={formRef} action={encaisser}>
          <input type="hidden" name="paiement" value={paiement} />
          <input type="hidden" name="lignes" value={payload} />
          <SubmitButton
            className="btn primary big"
            style={{ width: "100%" }}
            disabled={lignes.length === 0}
            pendingLabel="Encaissement…"
          >
            Encaisser {formatCFA(total)}
          </SubmitButton>
        </form>
        {flash ? (
          <div className="flash" style={{ display: "block" }}>
            {flash}
          </div>
        ) : (
          <div className="note">La vente baisse le stock automatiquement.</div>
        )}
      </div>
    </div>
  );
}
