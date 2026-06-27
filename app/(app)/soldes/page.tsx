import {
  reconciliationDuJour,
  historiqueReconciliations,
} from "@/lib/repo/comptes";
import { formatCFA } from "@/lib/money";
import { jourCourt } from "@/lib/dates";
import ReconciliationForm from "./ReconciliationForm";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function SoldesPage({
  searchParams,
}: {
  searchParams: Promise<{ jour?: string }>;
}) {
  const { jour: jourParam } = await searchParams;
  const jour =
    jourParam && /^\d{4}-\d{2}-\d{2}$/.test(jourParam)
      ? jourParam
      : new Date().toISOString().slice(0, 10);

  const reco = reconciliationDuJour(jour);
  const historique = historiqueReconciliations(14);

  return (
    <>
      <div className="topbar">
        <div>
          <h1>Soldes du jour</h1>
          <div className="when">
            Caisse + TMoney + Flooz : est-ce que tout l&apos;argent est là ?
          </div>
        </div>
        <div className="right">
          <form method="get">
            <input
              className="input"
              type="date"
              name="jour"
              defaultValue={jour}
              style={{ width: "auto" }}
            />{" "}
            <button type="submit" className="btn ghost">
              Afficher
            </button>
          </form>
        </div>
      </div>

      <ReconciliationForm jour={jour} lignes={reco.lignes} />

      <div className="section-gap"></div>

      <div className="card">
        <h2>Derniers jours</h2>
        <div className="hint">
          Si le manque revient souvent, c&apos;est qu&apos;il y a une fuite à
          chercher.
        </div>
        <table>
          <thead>
            <tr>
              <th>Jour</th>
              <th className="num">Attendu</th>
              <th className="num">Compté</th>
              <th className="num">Écart</th>
            </tr>
          </thead>
          <tbody>
            {historique.length === 0 ? (
              <tr>
                <td colSpan={4} className="muted">
                  Aucun solde enregistré pour l&apos;instant.
                </td>
              </tr>
            ) : (
              historique.map((h) => (
                <tr key={h.jour}>
                  <td className="muted">{jourCourt(`${h.jour}T12:00:00.000Z`)}</td>
                  <td className="num">{formatCFA(h.attendu)}</td>
                  <td className="num">{formatCFA(h.compte)}</td>
                  <td
                    className={`num ${
                      h.ecart < 0 ? "neg" : h.ecart > 0 ? "pos" : ""
                    }`}
                  >
                    {h.ecart === 0
                      ? "ça tombe juste"
                      : `${h.ecart > 0 ? "+" : ""}${formatCFA(h.ecart)}`}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
