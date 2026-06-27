"use client";

import { useMemo, useState } from "react";
import { formatCFA } from "@/lib/money";
import type { LigneReconciliation } from "@/lib/repo/comptes";
import { enregistrerSoldesAction } from "./actions";

export default function ReconciliationForm({
  jour,
  lignes,
}: {
  jour: string;
  lignes: LigneReconciliation[];
}) {
  // État éditable par compte : attendu (capital) + compté (réel).
  const [attendus, setAttendus] = useState<Record<number, string>>(
    Object.fromEntries(lignes.map((l) => [l.compte_id, String(l.attendu)]))
  );
  const [comptes, setComptes] = useState<Record<number, string>>(
    Object.fromEntries(
      lignes.map((l) => [l.compte_id, l.compte == null ? "" : String(l.compte)])
    )
  );

  const calc = useMemo(() => {
    const parLigne = lignes.map((l) => {
      const a = Number(attendus[l.compte_id] ?? 0) || 0;
      const cRaw = (comptes[l.compte_id] ?? "").trim();
      const compteValide = cRaw !== "" && Number.isFinite(Number(cRaw)) && Number(cRaw) >= 0;
      const c = compteValide ? Number(cRaw) : null;
      return { l, a, c, ecart: c == null ? null : c - a };
    });
    const comptees = parLigne.filter((x) => x.c != null);
    const attendu = comptees.reduce((s, x) => s + x.a, 0);
    const compte = comptees.reduce((s, x) => s + (x.c ?? 0), 0);
    return { parLigne, attendu, compte, ecart: compte - attendu, nb: comptees.length };
  }, [attendus, comptes, lignes]);

  const payload = JSON.stringify(
    calc.parLigne
      .filter((x) => x.c != null)
      .map((x) => ({ compteId: x.l.compte_id, attendu: x.a, compte: x.c }))
  );

  function verdict() {
    if (calc.nb === 0)
      return <span className="badge pay">Saisis les soldes pour vérifier</span>;
    if (calc.ecart === 0)
      return <span className="badge ok">Ça tombe juste ✓</span>;
    if (calc.ecart < 0)
      return <span className="badge bad">Il manque {formatCFA(-calc.ecart)}</span>;
    return <span className="badge warn">{formatCFA(calc.ecart)} en plus</span>;
  }

  return (
    <div
      className="grid"
      style={{ gridTemplateColumns: "1fr 340px", alignItems: "start" }}
    >
      <div className="card">
        <h2>Compte par compte</h2>
        <div className="hint">
          « Attendu » = ce qui devrait être là (ton capital). « Compté » = ce
          qu&apos;il y a vraiment. Laisse vide un compte que tu ne vérifies pas
          aujourd&apos;hui.
        </div>
        <table style={{ marginTop: 6 }}>
          <thead>
            <tr>
              <th>Compte</th>
              <th className="num">Attendu</th>
              <th className="num">Compté</th>
              <th className="num">Écart</th>
            </tr>
          </thead>
          <tbody>
            {calc.parLigne.map(({ l, ecart, c }) => (
              <tr key={l.compte_id}>
                <td className="prod">{l.nom}</td>
                <td className="num">
                  <input
                    className="input"
                    style={{ width: 110, padding: "6px 8px", textAlign: "right" }}
                    value={attendus[l.compte_id] ?? ""}
                    inputMode="numeric"
                    onChange={(e) =>
                      setAttendus((p) => ({ ...p, [l.compte_id]: e.target.value }))
                    }
                  />
                </td>
                <td className="num">
                  <input
                    className="input"
                    style={{ width: 110, padding: "6px 8px", textAlign: "right" }}
                    value={comptes[l.compte_id] ?? ""}
                    inputMode="numeric"
                    placeholder="—"
                    onChange={(e) =>
                      setComptes((p) => ({ ...p, [l.compte_id]: e.target.value }))
                    }
                  />
                </td>
                <td
                  className={`num ${
                    c == null ? "" : ecart! < 0 ? "neg" : ecart! > 0 ? "pos" : ""
                  }`}
                >
                  {c == null
                    ? "—"
                    : ecart === 0
                    ? "0 F"
                    : `${ecart! > 0 ? "+" : ""}${formatCFA(ecart!)}`}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="card">
        <h2>Ça tombe juste ?</h2>
        <div className="calcbox" style={{ marginTop: 8 }}>
          <div className="calcline">
            <span>Total attendu</span>
            <span>{formatCFA(calc.attendu)}</span>
          </div>
          <div className="calcline">
            <span>Total compté</span>
            <span>{formatCFA(calc.compte)}</span>
          </div>
          <div className="calcline total">
            <span>Écart</span>
            <span className={calc.ecart < 0 ? "neg" : calc.ecart > 0 ? "pos" : ""}>
              {calc.ecart > 0 ? "+" : ""}
              {formatCFA(calc.ecart)}
            </span>
          </div>
        </div>
        <div style={{ margin: "12px 0", textAlign: "center" }}>{verdict()}</div>

        <form action={enregistrerSoldesAction}>
          <input type="hidden" name="jour" value={jour} />
          <input type="hidden" name="lignes" value={payload} />
          <button
            type="submit"
            className="btn primary big"
            style={{ width: "100%" }}
            disabled={calc.nb === 0}
          >
            Enregistrer les soldes
          </button>
          <div className="note">
            Un manque qui revient = de l&apos;argent qui sort sans être noté.
          </div>
        </form>
      </div>
    </div>
  );
}
