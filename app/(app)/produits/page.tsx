import Link from "next/link";
import { listProduitsFiltres, listCategories } from "@/lib/repo/produits";
import NouveauProduitForm from "./NouveauProduitForm";
import ProduitsRows from "./ProduitsRows";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PAR_PAGE = 50;

export default async function ProduitsPage({
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
    return s ? `/produits?${s}` : "/produits";
  }

  return (
    <>
      <div className="topbar">
        <div>
          <h1>Produits</h1>
          <div className="when">
            Tous tes produits. Cherche par nom, filtre par catégorie ou stock bas.
          </div>
        </div>
        <Link href="/produits/import" className="btn ghost">
          Importer une liste
        </Link>
      </div>

      <div className="card" style={{ marginBottom: 18 }}>
        <h2>Nouveau produit</h2>
        <div className="hint">
          Tu peux aussi créer un produit directement en enregistrant un achat.
        </div>
        <NouveauProduitForm />
      </div>

      <div className="card">
        <h2>Liste des produits</h2>
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
              <th className="num">Prix d&apos;achat</th>
              <th className="num">Frais</th>
              <th className="num">Prix de vente</th>
              <th className="num">Marge</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {produits.length === 0 ? (
              <tr>
                <td colSpan={8} className="muted">
                  Aucun produit trouvé.
                </td>
              </tr>
            ) : (
              <ProduitsRows produits={produits} />
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
