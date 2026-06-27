import Link from "next/link";
import { listProduits } from "@/lib/repo/produits";
import ImportProduits from "./ImportProduits";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default function ImportProduitsPage() {
  const existants = listProduits().map((p) => p.nom);

  return (
    <>
      <div className="topbar">
        <div>
          <h1>Importer des produits</h1>
          <div className="when">
            Ajoute toute ta liste d&apos;un coup, au lieu de saisir un par un.
          </div>
        </div>
        <Link href="/produits" className="btn ghost">
          ← Produits
        </Link>
      </div>

      <ImportProduits existants={existants} />
    </>
  );
}
