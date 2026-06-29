import { listVentesDuJour } from "@/lib/repo/ventes";
import { formatCFA } from "@/lib/money";
import { jourCourt } from "@/lib/dates";
import { aujourdhuiLome } from "@/lib/periodes";
import { getSession } from "@/lib/auth";
import VenteCaisse from "./VenteCaisse";
import VentesRows from "./VentesRows";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function VentesPage({
  searchParams,
}: {
  searchParams: Promise<{ jour?: string }>;
}) {
  const session = await getSession();
  const peutGerer = session?.role === "proprietaire"; // seule la propriétaire modifie/supprime
  const { jour: jourParam } = await searchParams;
  const jour =
    jourParam && /^\d{4}-\d{2}-\d{2}$/.test(jourParam) ? jourParam : aujourdhuiLome();
  const estAujourdhui = jour === aujourdhuiLome();
  const ventes = listVentesDuJour(jour);
  const totalJour = ventes.reduce((s, v) => s + v.total, 0);

  return (
    <>
      <div className="topbar">
        <div>
          <h1>Nouvelle vente</h1>
          <div className="when">
            Pas besoin d&apos;ouvrir une caisse. Choisis le produit, c&apos;est
            tout.
          </div>
        </div>
      </div>

      <VenteCaisse />

      <div className="section-gap"></div>

      <div className="card">
        <div className="topbar" style={{ marginBottom: 8 }}>
          <h2 style={{ margin: 0 }}>
            {estAujourdhui ? "Ventes d'aujourd'hui" : `Ventes du ${jourCourt(`${jour}T12:00:00.000Z`)}`}
          </h2>
          <form method="get" className="right">
            <input className="input" type="date" name="jour" defaultValue={jour} style={{ width: "auto" }} />{" "}
            <button type="submit" className="btn ghost">
              Afficher
            </button>
          </form>
        </div>
        <div className="hint">
          {ventes.length} vente{ventes.length > 1 ? "s" : ""} — {formatCFA(totalJour)}.
          {peutGerer
            ? " Tu peux corriger une vente même d'un jour passé."
            : ""}
        </div>
        <table>
          <thead>
            <tr>
              <th>Heure</th>
              <th>Produits</th>
              <th>Paiement</th>
              <th className="num">Montant</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {ventes.length === 0 ? (
              <tr>
                <td colSpan={5} className="muted">
                  {estAujourdhui
                    ? "Aucune vente aujourd'hui pour l'instant."
                    : "Aucune vente ce jour-là."}
                </td>
              </tr>
            ) : (
              <VentesRows ventes={ventes} peutGerer={peutGerer} />
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
