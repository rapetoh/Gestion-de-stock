import { dashboard } from "@/lib/repo/stats";
import { produitsARecommander } from "@/lib/repo/produits";
import { formatCFA } from "@/lib/money";
import { dateLongue } from "@/lib/dates";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function badgeStock(stock: number, seuil: number) {
  if (stock <= 0) return <span className="badge bad">fini</span>;
  if (stock <= Math.ceil(seuil / 2))
    return <span className="badge bad">presque fini</span>;
  return <span className="badge warn">bas</span>;
}

export default function TableauDeBordPage() {
  const data = dashboard();
  const aRecommander = produitsARecommander();

  return (
    <>
      <div className="topbar">
        <div>
          <h1>Bonjour 👋</h1>
          <div className="when">{dateLongue()}</div>
        </div>
        <div className="right">
          <a className="btn ghost" href="/achats">
            Enregistrer un achat
          </a>
          <a className="btn primary" href="/ventes">
            Nouvelle vente
          </a>
        </div>
      </div>

      <div className="grid cols-4" style={{ marginBottom: 18 }}>
        <div className="card kpi">
          <span className="ic-corner">↑</span>
          <div className="label">Ventes d&apos;aujourd&apos;hui</div>
          <div className="value">
            {formatCFA(data.ventesDuJour).replace(" F", "")}
            <span className="u"> F</span>
          </div>
          <div className="delta up">{data.nbVentesDuJour} ventes aujourd&apos;hui</div>
        </div>

        <div className="card kpi">
          <span className="ic-corner">★</span>
          <div className="label">Marge du mois</div>
          <div className="value">
            {formatCFA(data.margeDuMois).replace(" F", "")}
            <span className="u"> F</span>
          </div>
          <div className="delta flat">marge sur marchandise vendue</div>
        </div>

        <div className="card kpi">
          <span className="ic-corner">▤</span>
          <div className="label">Produits à recommander</div>
          <div className="value">{data.nbARecommander}</div>
          <div className="delta flat">stock bas ou fini</div>
        </div>

        <div className="card kpi">
          <span className="ic-corner">★</span>
          <div className="label">Ce qui se vend le plus</div>
          <div className="value" style={{ fontSize: 22 }}>
            {data.topProduits[0]?.nom ?? "—"}
          </div>
          <div className="delta flat">en tête ce mois-ci</div>
        </div>
      </div>

      <div className="card">
        <h2>À recommander bientôt</h2>
        <div className="hint">
          Ces produits vont finir — pense à passer commande.
        </div>
        <table>
          <thead>
            <tr>
              <th>Produit</th>
              <th className="num">Reste</th>
              <th className="num">Seuil</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {aRecommander.length === 0 ? (
              <tr>
                <td colSpan={4} className="muted">
                  Rien à recommander pour l&apos;instant.
                </td>
              </tr>
            ) : (
              aRecommander.map((p) => (
                <tr key={p.id}>
                  <td className="prod">{p.nom}</td>
                  <td className="num">{p.stock}</td>
                  <td className="num muted">{p.seuil_stock}</td>
                  <td>{badgeStock(p.stock, p.seuil_stock)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="section-gap"></div>

      <div className="card">
        <h2>Classement des ventes du mois</h2>
        <div className="hint">
          Pour savoir sur quoi te concentrer — et ce qui ne marche pas.
        </div>
        <table>
          <thead>
            <tr>
              <th>Produit</th>
              <th className="num">Quantité vendue</th>
              <th className="num">Recette</th>
              <th className="num">Marge</th>
            </tr>
          </thead>
          <tbody>
            {data.topProduits.length === 0 ? (
              <tr>
                <td colSpan={4} className="muted">
                  Aucune vente ce mois-ci pour l&apos;instant.
                </td>
              </tr>
            ) : (
              data.topProduits.map((t) => (
                <tr key={t.nom}>
                  <td className="prod">{t.nom}</td>
                  <td className="num">{t.qte}</td>
                  <td className="num">{formatCFA(t.recette)}</td>
                  <td className="num pos">
                    {t.marge >= 0 ? "+" : ""}
                    {formatCFA(t.marge)}
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
