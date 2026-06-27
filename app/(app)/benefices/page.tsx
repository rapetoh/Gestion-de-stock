import { parProduit } from "@/lib/repo/benefices";
import { formatCFA } from "@/lib/money";
import { moisAnnee } from "@/lib/dates";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Liste des 12 derniers mois pour le sélecteur.
function dernierMois(): { value: string; label: string }[] {
  const out: { value: string; label: string }[] = [];
  const now = new Date();
  for (let i = 0; i < 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const y = d.getFullYear();
    const m = d.getMonth() + 1;
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
  const now = new Date();
  let year = now.getFullYear();
  let month = now.getMonth() + 1;
  if (mois && /^\d{4}-\d{2}$/.test(mois)) {
    const [y, m] = mois.split("-").map(Number);
    year = y;
    month = m;
  }

  const { lignes, totaux } = parProduit(year, month);
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
                <tr key={l.nom}>
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
