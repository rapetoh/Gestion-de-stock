import { listProduits } from "@/lib/repo/produits";
import { formatCFA } from "@/lib/money";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function badge(stock: number, seuil: number) {
  if (stock < 0) return <span className="badge bad">manquant</span>;
  if (stock === 0) return <span className="badge bad">fini</span>;
  if (stock <= seuil) return <span className="badge warn">bas</span>;
  return <span className="badge ok">ok</span>;
}

export default function StockPage() {
  const produits = listProduits();

  return (
    <>
      <div className="topbar">
        <div>
          <h1>Stock</h1>
          <div className="when">
            Ce qu&apos;il reste sur l&apos;étagère, en direct. Les produits bas
            sont en évidence.
          </div>
        </div>
      </div>

      <div className="card">
        <table>
          <thead>
            <tr>
              <th>Produit</th>
              <th>Catégorie</th>
              <th className="num">Stock</th>
              <th className="num">Seuil</th>
              <th className="num">Prix de vente</th>
              <th>État</th>
            </tr>
          </thead>
          <tbody>
            {produits.length === 0 ? (
              <tr>
                <td colSpan={6} className="muted">
                  Aucun produit pour l&apos;instant.
                </td>
              </tr>
            ) : (
              produits.map((p) => {
                const bas = p.stock <= p.seuil_stock;
                return (
                  <tr key={p.id} className={bas ? "flag-row" : undefined}>
                    <td className="prod">{p.nom}</td>
                    <td className="muted">{p.categorie ?? "—"}</td>
                    <td className={`num${p.stock < 0 ? " neg" : ""}`}>{p.stock}</td>
                    <td className="num muted">{p.seuil_stock}</td>
                    <td className="num">{formatCFA(p.prix_vente)}</td>
                    <td>{badge(p.stock, p.seuil_stock)}</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
