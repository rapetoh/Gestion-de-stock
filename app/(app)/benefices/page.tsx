import Link from "next/link";
import { parProduit } from "@/lib/repo/benefices";
import { totalDepensesMois } from "@/lib/repo/depenses";
import { totalCommissionsMois } from "@/lib/repo/commissions";
import { formatCFA } from "@/lib/money";
import { moisAnnee } from "@/lib/dates";
import { anneeMoisCourants } from "@/lib/periodes";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Liste des 12 derniers mois pour le sélecteur (heure de Lomé / UTC).
function dernierMois(): { value: string; label: string }[] {
  const out: { value: string; label: string }[] = [];
  const { year, month } = anneeMoisCourants();
  for (let i = 0; i < 12; i++) {
    const d = new Date(Date.UTC(year, month - 1 - i, 1));
    const y = d.getUTCFullYear();
    const m = d.getUTCMonth() + 1;
    out.push({ value: `${y}-${String(m).padStart(2, "0")}`, label: moisAnnee(y, m) });
  }
  return out;
}

export default async function BeneficesPage({
  searchParams,
}: {
  searchParams: Promise<{ mois?: string }>;
}) {
  const { mois } = await searchParams;
  const courant = anneeMoisCourants();
  let year = courant.year;
  let month = courant.month;
  if (mois && /^\d{4}-\d{2}$/.test(mois)) {
    const [y, m] = mois.split("-").map(Number);
    year = y;
    month = m;
  }

  const { lignes, totaux } = parProduit(year, month);
  const depensesMois = totalDepensesMois(year, month);
  const commissionsMois = totalCommissionsMois(year, month);
  // Marge réelle = marge marchandise + commissions Mobile Money − dépenses du mois.
  const margeReelle = totaux.marge + commissionsMois - depensesMois;
  const options = dernierMois();
  const selected = `${year}-${String(month).padStart(2, "0")}`;

  return (
    <>
      <div className="topbar">
        <div>
          <h1>Bénéfices</h1>
          <div className="when">
            Ce que tu as vraiment gagné — recette moins le coût de la
            marchandise.
          </div>
        </div>
        <div className="right">
          <form method="get">
            <select
              className="input"
              style={{ width: "auto" }}
              name="mois"
              defaultValue={selected}
              // Soumet le formulaire au changement de mois.
              // (composant serveur : on s'appuie sur un bouton de repli ci-dessous)
            >
              {options.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>{" "}
            <button type="submit" className="btn ghost">
              Afficher
            </button>
          </form>
        </div>
      </div>

      <div className="grid cols-4" style={{ marginBottom: 18 }}>
        <div className="card kpi">
          <div className="label">Recette (ventes)</div>
          <div className="value">
            {formatCFA(totaux.vendu).replace(" F", "")}
            <span className="u"> F</span>
          </div>
        </div>
        <div className="card kpi">
          <div className="label">Achats (marchandise)</div>
          <div className="value">
            {formatCFA(totaux.achete).replace(" F", "")}
            <span className="u"> F</span>
          </div>
        </div>
        <div className="card kpi">
          <div className="label">Frais (transport)</div>
          <div className="value">
            {formatCFA(totaux.frais).replace(" F", "")}
            <span className="u"> F</span>
          </div>
        </div>
        <div
          className="card kpi"
          style={{ background: "var(--primary-l)", borderColor: "#cfe7dd" }}
        >
          <div className="label">Marge</div>
          <div className="value" style={{ color: "var(--primary-d)" }}>
            {formatCFA(totaux.marge).replace(" F", "")}
            <span className="u"> F</span>
          </div>
          <div className="delta up">ce que la marchandise t&apos;a rapporté</div>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 18 }}>
        <h2>Ton gain réel ce mois-ci</h2>
        <div className="hint">
          La marge sur la marchandise, moins les dépenses de la boutique.
        </div>
        <div className="calcbox" style={{ marginTop: 8 }}>
          <div className="calcline">
            <span>Marge sur marchandise</span>
            <span>{formatCFA(totaux.marge)}</span>
          </div>
          <div className="calcline">
            <span>
              + Commissions Mobile Money{" "}
              <Link href={`/commissions?mois=${selected}`} className="lien">
                (voir / modifier)
              </Link>
            </span>
            <span className="pos">{formatCFA(commissionsMois)}</span>
          </div>
          <div className="calcline">
            <span>
              − Dépenses du mois{" "}
              <Link href={`/depenses?mois=${selected}`} className="lien">
                (voir / modifier)
              </Link>
            </span>
            <span className="neg">{formatCFA(depensesMois)}</span>
          </div>
          <div className="calcline total">
            <span>Marge réelle (net)</span>
            <span className={margeReelle >= 0 ? "pos" : "neg"}>
              {margeReelle >= 0 ? "+" : ""}
              {formatCFA(margeReelle)}
            </span>
          </div>
        </div>
      </div>

      <div className="card">
        <h2>Produit par produit</h2>
        <div className="hint">
          Sur une seule ligne : combien acheté, les frais, combien vendu, et ta
          marge.
        </div>
        <table>
          <thead>
            <tr>
              <th>Produit</th>
              <th className="num">Qté vendue</th>
              <th className="num">Acheté</th>
              <th className="num">Frais</th>
              <th className="num">Vendu</th>
              <th className="num">Marge</th>
            </tr>
          </thead>
          <tbody>
            {lignes.length === 0 ? (
              <tr>
                <td colSpan={6} className="muted">
                  Aucune vente sur ce mois.
                </td>
              </tr>
            ) : (
              lignes.map((l) => (
                <tr key={l.produitId ?? l.nom}>
                  <td className="prod">{l.nom}</td>
                  <td className="num">{l.qteVendue}</td>
                  <td className="num">{formatCFA(l.achete)}</td>
                  <td className="num">{formatCFA(l.frais)}</td>
                  <td className="num">{formatCFA(l.vendu)}</td>
                  <td className={`num ${l.marge >= 0 ? "pos" : "neg"}`}>
                    {l.marge >= 0 ? "+" : ""}
                    {formatCFA(l.marge)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
          {lignes.length > 0 ? (
            <tfoot>
              <tr>
                <td>Total</td>
                <td className="num">{totaux.qteVendue}</td>
                <td className="num">{formatCFA(totaux.achete)}</td>
                <td className="num">{formatCFA(totaux.frais)}</td>
                <td className="num">{formatCFA(totaux.vendu)}</td>
                <td className={`num ${totaux.marge >= 0 ? "pos" : "neg"}`}>
                  {totaux.marge >= 0 ? "+" : ""}
                  {formatCFA(totaux.marge)}
                </td>
              </tr>
            </tfoot>
          ) : null}
        </table>
      </div>
    </>
  );
}
