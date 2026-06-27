import { listProduits } from "@/lib/repo/produits";
import { ajouterProduit } from "./actions";
import ProduitRow from "./ProduitRow";

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
      </div>

      <div className="card" style={{ marginBottom: 18 }}>
        <h2>Nouveau produit</h2>
        <div className="hint">
          Tu peux aussi créer un produit directement en enregistrant un achat.
        </div>
        <form action={ajouterProduit}>
          <div className="row3" style={{ marginBottom: 12 }}>
            <div className="field" style={{ margin: 0 }}>
              <label>Nom</label>
              <input className="input" name="nom" required />
            </div>
            <div className="field" style={{ margin: 0 }}>
              <label>Catégorie</label>
              <input className="input" name="categorie" />
            </div>
            <div className="field" style={{ margin: 0 }}>
              <label>Stock de départ</label>
              <input
                className="input"
                name="stock"
                defaultValue="0"
                inputMode="numeric"
              />
            </div>
          </div>
          <div className="row3" style={{ marginBottom: 12 }}>
            <div className="field" style={{ margin: 0 }}>
              <label>Prix d&apos;achat</label>
              <input
                className="input"
                name="prixAchat"
                defaultValue="0"
                inputMode="numeric"
              />
            </div>
            <div className="field" style={{ margin: 0 }}>
              <label>Frais (unitaire)</label>
              <input
                className="input"
                name="frais"
                defaultValue="0"
                inputMode="numeric"
              />
            </div>
            <div className="field" style={{ margin: 0 }}>
              <label>Prix de vente</label>
              <input
                className="input"
                name="prixVente"
                defaultValue="0"
                inputMode="numeric"
              />
            </div>
          </div>
          <div className="row2" style={{ marginBottom: 12 }}>
            <div className="field" style={{ margin: 0 }}>
              <label>Seuil de stock</label>
              <input
                className="input"
                name="seuilStock"
                defaultValue="0"
                inputMode="numeric"
              />
            </div>
            <div className="field" style={{ margin: 0 }}>
              <label>
                Code-barres <span className="sub">(facultatif)</span>
              </label>
              <input className="input" name="codeBarre" />
            </div>
          </div>
          <button type="submit" className="btn primary big">
            Ajouter le produit
          </button>
        </form>
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
              produits.map((p) => <ProduitRow key={p.id} p={p} />)
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
