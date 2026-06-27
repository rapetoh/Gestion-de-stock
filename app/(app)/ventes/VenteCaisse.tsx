"use client";

import { useMemo, useRef, useState } from "react";
import { formatCFA } from "@/lib/money";
import type { Produit } from "@/lib/repo/produits";
import { encaisserVente } from "./actions";

type Ligne = { produitId: number; nom: string; prix: number; quantite: number };
type Paiement = "especes" | "tmoney" | "flooz" | "credit";

const PAY: { id: Paiement; ic: string; label: string }[] = [
  { id: "especes", ic: "💵", label: "Espèces" },
  { id: "tmoney", ic: "📲", label: "TMoney" },
  { id: "flooz", ic: "📲", label: "Flooz" },
  { id: "credit", ic: "⏳", label: "Crédit (plus tard)" },
];

export default function VenteCaisse({ produits }: { produits: Produit[] }) {
  const [recherche, setRecherche] = useState("");
  const [lignes, setLignes] = useState<Ligne[]>([]);
  const [paiement, setPaiement] = useState<Paiement>("especes");
  const formRef = useRef<HTMLFormElement>(null);

  function ajouter(p: Produit) {
    setLignes((prev) => {
      const existing = prev.find((l) => l.produitId === p.id);
      if (existing) {
        return prev.map((l) =>
          l.produitId === p.id ? { ...l, quantite: l.quantite + 1 } : l
        );
      }
      return [
        ...prev,
        { produitId: p.id, nom: p.nom, prix: p.prix_vente, quantite: 1 },
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

  const suggestions = useMemo(() => {
    const s = recherche.trim().toLowerCase();
    if (!s) return [];
    return produits.filter((p) => p.nom.toLowerCase().includes(s)).slice(0, 8);
  }, [recherche, produits]);

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
            placeholder="Tape le nom… ex : eau, savon"
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
                  <span>{p.nom}</span>
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
                  <td className="prod">{l.nom}</td>
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
        <div className="paygrid" style={{ marginBottom: 16 }}>
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

        <form ref={formRef} action={encaisserVente}>
          <input type="hidden" name="paiement" value={paiement} />
          <input type="hidden" name="lignes" value={payload} />
          <button
            type="submit"
            className="btn primary big"
            style={{ width: "100%" }}
            disabled={lignes.length === 0}
          >
            Encaisser {formatCFA(total)}
          </button>
        </form>
        <div className="note">La vente baisse le stock automatiquement.</div>
      </div>
    </div>
  );
}
