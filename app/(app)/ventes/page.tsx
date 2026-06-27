import { listProduits } from "@/lib/repo/produits";
import { listVentesDuJour } from "@/lib/repo/ventes";
import { formatCFA } from "@/lib/money";
import { heure } from "@/lib/dates";
import VenteCaisse from "./VenteCaisse";
import { supprimerVente } from "./actions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PAY_LABEL: Record<string, string> = {
  especes: "Espèces",
  tmoney: "TMoney",
  flooz: "Flooz",
  credit: "Crédit",
};

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
                <tr key={v.id}>
                  <td className="muted">{heure(v.date)}</td>
                  <td>
                    {v.lignes
                      .map((l) => `${l.nom_produit} ×${l.quantite}`)
                      .join(", ")}
                  </td>
                  <td>
                    <span className="badge pay">
                      {PAY_LABEL[v.paiement] ?? v.paiement}
                    </span>
                  </td>
                  <td className="num">{formatCFA(v.total)}</td>
                  <td className="num">
                    <form action={supprimerVente}>
                      <input type="hidden" name="id" value={v.id} />
                      <button type="submit" className="btn ghost">
                        Supprimer
                      </button>
                    </form>
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
