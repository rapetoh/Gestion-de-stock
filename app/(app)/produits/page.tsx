import Link from "next/link";
import { listProduits } from "@/lib/repo/produits";
import NouveauProduitForm from "./NouveauProduitForm";
import ProduitsRows from "./ProduitsRows";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function ProduitsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const produits = listProduits(q);

  return (
    <>
      <div className="topbar">
        <div>
          <h1>Produits</h1>
          <div className="when">
            Tous tes produits. Cherche par nom, le code-barres n&apos;est jamais
            obligatoire.
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
        <form method="get" style={{ marginBottom: 14 }}>
          <input
            className="input"
            name="q"
            placeholder="Chercher un produit par nom…"
            defaultValue={q ?? ""}
          />
        </form>
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
      </div>
    </>
  );
}
