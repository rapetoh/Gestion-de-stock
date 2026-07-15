import Link from "next/link";
import { formatCFA } from "@/lib/money";
import { moisAnnee, jourCourt, dateLongue } from "@/lib/dates";
import { anneeMoisCourants } from "@/lib/periodes";
import { parProduit } from "@/lib/repo/benefices";
import { depensesDuMois, totalDepensesMois } from "@/lib/repo/depenses";
import { totalCommissionsMois } from "@/lib/repo/commissions";
import {
  paiementsDuMois,
  topProduitsMois,
  valeurStock,
  controlesDuMois,
} from "@/lib/repo/stats";
import PrintButton from "@/components/PrintButton";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PAIEMENT_LABEL: Record<string, string> = {
  especes: "Espèces",
  tmoney: "TMoney",
  flooz: "Flooz",
  credit: "Crédit",
};

// Rapport mensuel : une page propre, pensée pour l'impression et le PDF
// (contrôle, impôts, banque). Le bouton « Exporter en PDF » ouvre l'impression
// du navigateur ; « Enregistrer au format PDF » y est proposé partout.
export default async function RapportPage({
  searchParams,
}: {
  searchParams: Promise<{ mois?: string }>;
}) {
  const { mois } = await searchParams;
  let { year, month } = anneeMoisCourants();
  if (mois && /^\d{4}-\d{2}$/.test(mois)) {
    const [y, m] = mois.split("-").map(Number);
    if (m >= 1 && m <= 12) {
      year = y;
      month = m;
    }
  }
  const selected = `${year}-${String(month).padStart(2, "0")}`;

  const benefices = parProduit(year, month);
  const depensesTotal = totalDepensesMois(year, month);
  const commissions = totalCommissionsMois(year, month);
  const margeReelle = benefices.totaux.marge + commissions - depensesTotal;
  const paiements = paiementsDuMois(year, month);
  const totalVentes = paiements.reduce((s, p) => s + p.total, 0);
  const top = topProduitsMois(year, month, 10);
  const depenses = depensesDuMois(year, month);
  const controles = controlesDuMois(year, month);
  const stock = valeurStock();

  return (
    <div className="rapport">
      <div className="topbar">
        <div>
          <h1>Rapport mensuel</h1>
          <div className="when">Une page à imprimer ou à garder en PDF.</div>
        </div>
        <div className="right">
          <Link className="btn ghost" href={`/stats?mois=${selected}`}>
            Retour aux statistiques
          </Link>
          <PrintButton label="Exporter en PDF" />
        </div>
      </div>

      <div className="card">
        <div className="entete">
          <div>
            <strong style={{ fontSize: 20 }}>Mon Panier</strong>
            <div className="muted" style={{ fontSize: 13 }}>
              Rapport d&apos;activité : {moisAnnee(year, month)}
            </div>
          </div>
          <div className="muted" style={{ fontSize: 13 }}>
            Édité le {dateLongue()}
          </div>
        </div>

        <h2>1. Résultat du mois</h2>
        <table>
          <tbody>
            <tr>
              <td>Recette (ventes)</td>
              <td className="num">{formatCFA(benefices.totaux.vendu)}</td>
            </tr>
            <tr>
              <td>Coût de la marchandise vendue</td>
              <td className="num">{formatCFA(benefices.totaux.achete)}</td>
            </tr>
            <tr>
              <td>Frais de transport (part vendue)</td>
              <td className="num">{formatCFA(benefices.totaux.frais)}</td>
            </tr>
            <tr>
              <td>
                <strong>Marge sur marchandise</strong>
              </td>
              <td className="num">
                <strong>{formatCFA(benefices.totaux.marge)}</strong>
              </td>
            </tr>
            <tr>
              <td>Commissions Mobile Money</td>
              <td className="num">+ {formatCFA(commissions)}</td>
            </tr>
            <tr>
              <td>Dépenses du mois</td>
              <td className="num">- {formatCFA(depensesTotal)}</td>
            </tr>
            <tr>
              <td>
                <strong>Résultat net du mois</strong>
              </td>
              <td className="num">
                <strong>{formatCFA(margeReelle)}</strong>
              </td>
            </tr>
          </tbody>
        </table>

        <h2>2. Ventes par moyen de paiement</h2>
        <table>
          <thead>
            <tr>
              <th>Moyen</th>
              <th className="num">Nombre de ventes</th>
              <th className="num">Montant</th>
              <th className="num">Part</th>
            </tr>
          </thead>
          <tbody>
            {paiements.map((p) => (
              <tr key={p.paiement}>
                <td>{PAIEMENT_LABEL[p.paiement] ?? p.paiement}</td>
                <td className="num">{p.nb}</td>
                <td className="num">{formatCFA(p.total)}</td>
                <td className="num">
                  {totalVentes > 0 ? `${Math.round((p.total / totalVentes) * 100)} %` : "0 %"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <h2>3. Les 10 produits les plus rentables</h2>
        {top.length === 0 ? (
          <div className="muted">Aucune vente ce mois-ci.</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Produit</th>
                <th className="num">Quantité</th>
                <th className="num">Recette</th>
                <th className="num">Marge</th>
              </tr>
            </thead>
            <tbody>
              {top.map((t) => (
                <tr key={t.nom}>
                  <td className="prod">{t.nom}</td>
                  <td className="num">{t.qte}</td>
                  <td className="num">{formatCFA(t.recette)}</td>
                  <td className="num">{formatCFA(t.marge)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        <h2>4. Dépenses du mois</h2>
        {depenses.length === 0 ? (
          <div className="muted">Aucune dépense enregistrée ce mois-ci.</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Libellé</th>
                <th>Catégorie</th>
                <th className="num">Montant</th>
              </tr>
            </thead>
            <tbody>
              {depenses.map((d) => (
                <tr key={d.id}>
                  <td>
                    {d.libelle}
                    {d.recurrente ? <span className="muted"> (chaque mois)</span> : null}
                  </td>
                  <td className="muted">{d.categorie ?? "-"}</td>
                  <td className="num">{formatCFA(d.montant)}</td>
                </tr>
              ))}
              <tr>
                <td colSpan={2}>
                  <strong>Total</strong>
                </td>
                <td className="num">
                  <strong>{formatCFA(depensesTotal)}</strong>
                </td>
              </tr>
            </tbody>
          </table>
        )}

        <h2>5. Contrôles de stock du mois</h2>
        {controles.length === 0 ? (
          <div className="muted">Aucun contrôle de stock ce mois-ci.</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Note</th>
                <th className="num">Produits comptés</th>
                <th className="num">Manque</th>
                <th className="num">Surplus</th>
              </tr>
            </thead>
            <tbody>
              {controles.map((c) => (
                <tr key={c.id}>
                  <td>{jourCourt(c.date)}</td>
                  <td className="muted">{c.note ?? "-"}</td>
                  <td className="num">{c.produits}</td>
                  <td className="num">{c.manque > 0 ? formatCFA(c.manque) : "-"}</td>
                  <td className="num">{c.surplus > 0 ? formatCFA(c.surplus) : "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        <h2>6. Stock au jour de l&apos;édition</h2>
        <table>
          <tbody>
            <tr>
              <td>Produits en rayon</td>
              <td className="num">{stock.nbProduits}</td>
            </tr>
            <tr>
              <td>Unités en stock</td>
              <td className="num">{stock.unites}</td>
            </tr>
            <tr>
              <td>Valeur du stock au coût d&apos;achat</td>
              <td className="num">{formatCFA(stock.cout)}</td>
            </tr>
            <tr>
              <td>Valeur de revente possible</td>
              <td className="num">{formatCFA(stock.vente)}</td>
            </tr>
          </tbody>
        </table>

        <div className="signature">
          <div>Fait à ______________________, le ____________</div>
          <div>Signature</div>
        </div>
      </div>
    </div>
  );
}
