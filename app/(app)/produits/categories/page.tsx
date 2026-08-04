import Link from "next/link";
import { listCategoriesGerees } from "@/lib/repo/categories";
import SubmitButton from "@/components/SubmitButton";
import { ajouterCategorieAction } from "./actions";
import CategorieRow from "./CategorieRow";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default function CategoriesPage() {
  const categories = listCategoriesGerees();

  return (
    <>
      <div className="topbar">
        <div>
          <h1>Catégories</h1>
          <div className="when">
            Les rayons de ta boutique. Renommer une catégorie met à jour tous ses
            produits d&apos;un coup.
          </div>
        </div>
        <Link href="/produits" className="btn ghost">
          Retour aux produits
        </Link>
      </div>

      <div className="card" style={{ marginBottom: 18 }}>
        <h2>Ajouter une catégorie</h2>
        <div className="hint">
          Pas obligatoire : taper une nouvelle catégorie sur un produit
          l&apos;ajoute aussi à cette liste, toute seule.
        </div>
        <form
          action={ajouterCategorieAction}
          style={{ display: "flex", gap: 10, marginTop: 8, maxWidth: 480 }}
        >
          <input
            className="input"
            name="nom"
            placeholder="ex : Boissons chaudes"
            autoComplete="off"
            required
          />
          <SubmitButton className="btn primary">Ajouter</SubmitButton>
        </form>
      </div>

      <div className="card">
        <h2>Tes catégories ({categories.length})</h2>
        <table>
          <thead>
            <tr>
              <th>Catégorie</th>
              <th className="num">Produits</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {categories.map((c) => (
              <CategorieRow key={c.id} c={c} />
            ))}
          </tbody>
        </table>
        <div className="note">
          Supprimer une catégorie ne supprime jamais les produits : ils restent,
          simplement sans étiquette. Les catégories de dépenses (Loyer,
          Salaires…) sont à part et ne bougent pas.
        </div>
      </div>
    </>
  );
}
