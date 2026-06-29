import Link from "next/link";
import { listProduitsFiltres, listCategories } from "@/lib/repo/produits";
import { formatCFA } from "@/lib/money";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PAR_PAGE = 50;

function badge(stock: number, seuil: number) {
  if (stock < 0) return <span className="badge bad">manquant</span>;
  if (stock === 0) return <span className="badge bad">fini</span>;
  if (stock <= seuil) return <span className="badge warn">bas</span>;
  return <span className="badge ok">ok</span>;
}

export default async function StockPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; cat?: string; bas?: string; page?: string }>;
}) {
  const { q, cat, bas, page } = await searchParams;
  const recherche = q ?? "";
  const categorie = cat ?? "";
  const basStock = bas === "1";
  const pageNum = Math.max(1, Number(page) || 1);

  const { produits, total } = listProduitsFiltres({
    recherche,
    categorie: categorie || null,
    basStock,
    limit: PAR_PAGE,
    offset: (pageNum - 1) * PAR_PAGE,
  });
  const categories = listCategories();
  const totalPages = Math.max(1, Math.ceil(total / PAR_PAGE));

  function lienPage(p: number): string {
    const sp = new URLSearchParams();
    if (recherche) sp.set("q", recherche);
    if (categorie) sp.set("cat", categorie);
    if (basStock) sp.set("bas", "1");
    if (p > 1) sp.set("page", String(p));
    const s = sp.toString();
    return s ? `/stock?${s}` : "/stock";
  }

  return (
    <>
      <div className="topbar">
        <div>
          <h1>Stock</h1>
          <div className="when">
            Ce qu&apos;il reste sur l&apos;étagère. Filtre par catégorie ou « stock
            bas » pour voir vite ce qui manque.
          </div>
        </div>
      </div>

      <div className="card">
        <form method="get" style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 14 }}>
          <input
            className="input"
            name="q"
            placeholder="Chercher par nom…"
            defaultValue={recherche}
            style={{ flex: "1 1 200px" }}
          />
          <select className="input" name="cat" defaultValue={categorie} style={{ width: "auto" }}>
            <option value="">Toutes les catégories</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <label style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }}>
            <input type="checkbox" name="bas" value="1" defaultChecked={basStock} />
            Stock bas seulement
          </label>
          <button type="submit" className="btn ghost">
            Filtrer
          </button>
        </form>

        <div className="hint" style={{ marginBottom: 10 }}>
          {total} produit{total > 1 ? "s" : ""}
          {totalPages > 1 ? ` — page ${pageNum} / ${totalPages}` : ""}
        </div>

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
                  Aucun produit trouvé.
                </td>
              </tr>
            ) : (
              produits.map((p) => {
                const basligne = p.stock <= p.seuil_stock;
                return (
                  <tr key={p.id} className={basligne ? "flag-row" : undefined}>
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

        {totalPages > 1 ? (
          <div style={{ display: "flex", gap: 10, justifyContent: "space-between", marginTop: 12 }}>
            {pageNum > 1 ? (
              <Link href={lienPage(pageNum - 1)} className="btn ghost">
                ← Précédents
              </Link>
            ) : (
              <span />
            )}
            {pageNum < totalPages ? (
              <Link href={lienPage(pageNum + 1)} className="btn ghost">
                Suivants →
              </Link>
            ) : (
              <span />
            )}
          </div>
        ) : null}
      </div>
    </>
  );
}
