import { listProduits } from "@/lib/repo/produits";
import { listVentesDuJour } from "@/lib/repo/ventes";
import { formatCFA } from "@/lib/money";
import { heure } from "@/lib/dates";
import VenteCaisse from "./VenteCaisse";
import VenteRow from "./VenteRow";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default function VentesPage() {
  const produits = listProduits();
  const ventes = listVentesDuJour();
  const totalJour = ventes.reduce((s, v) => s + v.total, 0);

  return (
    <>
      <div className="topbar">
        <div>
          <h1>Nouvelle vente</h1>
          <div className="when">
            Pas besoin d&apos;ouvrir une caisse. Choisis le produit, c&apos;est
            tout.
          </div>
        </div>
      </div>

      <VenteCaisse produits={produits} />

      <div className="section-gap"></div>

      <div className="card">
        <h2>Ventes d&apos;aujourd&apos;hui</h2>
        <div className="hint">
          {ventes.length} vente{ventes.length > 1 ? "s" : ""} —{" "}
          {formatCFA(totalJour)}.
        </div>
        <table>
          <thead>
            <tr>
              <th>Heure</th>
              <th>Produits</th>
              <th>Paiement</th>
              <th className="num">Montant</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {ventes.length === 0 ? (
              <tr>
                <td colSpan={5} className="muted">
                  Aucune vente aujourd&apos;hui pour l&apos;instant.
                </td>
              </tr>
            ) : (
              ventes.map((v) => (
                <VenteRow key={v.id} v={v} heureLabel={heure(v.date)} />
              ))
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
