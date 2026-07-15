import Link from "next/link";
import { formatCFA } from "@/lib/money";
import { moisAnnee, jourCourt } from "@/lib/dates";
import { anneeMoisCourants } from "@/lib/periodes";
import { parProduit } from "@/lib/repo/benefices";
import { totalDepensesMois } from "@/lib/repo/depenses";
import { totalCommissionsMois } from "@/lib/repo/commissions";
import {
  caParJour,
  recetteMargeParMois,
  paiementsDuMois,
  topProduitsMois,
  ventesParJourSemaine,
  valeurStock,
  produitsDormants,
  nbProduitsDormants,
  manquesParMois,
  depensesParCategorieMois,
} from "@/lib/repo/stats";
import {
  BarresVerticales,
  BarresHorizontales,
  Legende,
  COULEURS,
} from "@/components/Charts";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MOIS_COURT = [
  "janv.", "févr.", "mars", "avr.", "mai", "juin",
  "juil.", "août", "sept.", "oct.", "nov.", "déc.",
];
const JOURS = ["dim.", "lun.", "mar.", "mer.", "jeu.", "ven.", "sam."];
const PAIEMENT_LABEL: Record<string, string> = {
  especes: "Espèces",
  tmoney: "TMoney",
  flooz: "Flooz",
  credit: "Crédit",
};

// Les 12 derniers mois pour le sélecteur (même logique que Bénéfices).
function derniersMois(): { value: string; label: string }[] {
  const { year, month } = anneeMoisCourants();
  const out: { value: string; label: string }[] = [];
  for (let k = 0; k < 12; k++) {
    const d = new Date(Date.UTC(year, month - 1 - k, 1));
    const y = d.getUTCFullYear();
    const m = d.getUTCMonth() + 1;
    out.push({ value: `${y}-${String(m).padStart(2, "0")}`, label: moisAnnee(y, m) });
  }
  return out;
}

export default async function StatsPage({
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

  // Chiffres du mois choisi (mêmes calculs que Bénéfices : jamais deux vérités).
  const benefices = parProduit(year, month);
  const depensesMois = totalDepensesMois(year, month);
  const commissionsMois = totalCommissionsMois(year, month);
  const margeReelle = benefices.totaux.marge + commissionsMois - depensesMois;
  const paiements = paiementsDuMois(year, month);
  const totalPaiements = paiements.reduce((s, p) => s + p.total, 0);
  const top = topProduitsMois(year, month, 8);
  const depensesCat = depensesParCategorieMois(year, month);

  // Tendances (fenêtres glissantes, indépendantes du mois choisi).
  const parJour = caParJour(30);
  const parMois = recetteMargeParMois(12);
  const parSemaine = ventesParJourSemaine(8);
  const manques = manquesParMois(12);
  const stock = valeurStock();
  const dormants = produitsDormants(30, 8);
  const nbDormants = nbProduitsDormants(30);

  // Lundi d'abord : c'est comme ça qu'on pense la semaine.
  const ordreSemaine = [1, 2, 3, 4, 5, 6, 0];

  return (
    <>
      <div className="topbar">
        <div>
          <h1>Statistiques</h1>
          <div className="when">
            La boutique en graphiques : ce qui monte, ce qui dort, où va l&apos;argent.
          </div>
        </div>
        <div className="right">
          <form method="get">
            <select className="input" style={{ width: "auto" }} name="mois" defaultValue={selected}>
              {derniersMois().map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>{" "}
            <button type="submit" className="btn ghost">
              Afficher
            </button>
          </form>
          <Link className="btn primary" href={`/stats/rapport?mois=${selected}`}>
            Rapport du mois (PDF)
          </Link>
        </div>
      </div>

      <div className="grid cols-4" style={{ marginBottom: 18 }}>
        <div className="card kpi">
          <div className="label">Recette · {moisAnnee(year, month)}</div>
          <div className="value">
            {formatCFA(benefices.totaux.vendu).replace(" F", "")}
            <span className="u"> F</span>
          </div>
          <div className="delta flat">{benefices.totaux.qteVendue} articles vendus</div>
        </div>
        <div className="card kpi">
          <div className="label">Marge réelle du mois</div>
          <div className="value">
            {formatCFA(margeReelle).replace(" F", "")}
            <span className="u"> F</span>
          </div>
          <div className="delta flat">marchandise + commissions, moins dépenses</div>
        </div>
        <div className="card kpi">
          <div className="label">Dépenses du mois</div>
          <div className="value">
            {formatCFA(depensesMois).replace(" F", "")}
            <span className="u"> F</span>
          </div>
          <div className="delta flat">commissions reçues : {formatCFA(commissionsMois)}</div>
        </div>
        <div className="card kpi">
          <div className="label">Valeur du stock (au coût)</div>
          <div className="value">
            {formatCFA(stock.cout).replace(" F", "")}
            <span className="u"> F</span>
          </div>
          <div className="delta flat">
            {stock.unites} unités, revente possible {formatCFA(stock.vente)}
          </div>
        </div>
      </div>

      <div className="stats-grid">
        <div className="card">
          <h2>Ventes des 30 derniers jours</h2>
          <div className="hint">Chaque barre est un jour. Les jours à zéro comptent aussi.</div>
          <BarresVerticales
            points={parJour.map((p, i) => ({
              label: i % 5 === 0 ? p.jour.slice(8, 10) + "/" + p.jour.slice(5, 7) : "",
              valeurs: [p.total],
              hint: jourCourt(`${p.jour}T12:00:00.000Z`),
            }))}
            series={[{ nom: "Ventes", couleur: COULEURS.serie1 }]}
          />
        </div>

        <div className="card">
          <h2>Recette et marge, 12 derniers mois</h2>
          <div className="hint">
            La recette, et ce qu&apos;il en reste une fois la marchandise payée.
          </div>
          <Legende
            series={[
              { nom: "Recette", couleur: COULEURS.serie1 },
              { nom: "Marge marchandise", couleur: COULEURS.serie2 },
            ]}
          />
          <BarresVerticales
            points={parMois.map((p) => ({
              label: MOIS_COURT[p.mois - 1],
              valeurs: [p.recette, p.marge],
              hint: moisAnnee(p.annee, p.mois),
            }))}
            series={[
              { nom: "Recette", couleur: COULEURS.serie1 },
              { nom: "Marge marchandise", couleur: COULEURS.serie2 },
            ]}
          />
        </div>

        <div className="card">
          <h2>Comment les clients paient · {moisAnnee(year, month)}</h2>
          <div className="hint">
            Utile pour préparer la monnaie et surveiller le crédit.
          </div>
          <BarresHorizontales
            lignes={paiements.map((p) => ({
              label: PAIEMENT_LABEL[p.paiement] ?? p.paiement,
              valeur: p.total,
              couleur: COULEURS.paiements[p.paiement],
              sous:
                totalPaiements > 0
                  ? `${p.nb} vente${p.nb > 1 ? "s" : ""} (${Math.round((p.total / totalPaiements) * 100)} %)`
                  : "aucune vente",
            }))}
          />
        </div>

        <div className="card">
          <h2>Ce qui te rapporte le plus · {moisAnnee(year, month)}</h2>
          <div className="hint">Classé par marge gagnée, pas par quantité.</div>
          {top.length === 0 ? (
            <div className="muted" style={{ padding: "8px 0" }}>
              Aucune vente ce mois-ci.
            </div>
          ) : (
            <BarresHorizontales
              lignes={top.map((t) => ({
                label: t.nom,
                valeur: t.marge,
                sous: `${t.qte} vendus, recette ${formatCFA(t.recette)}`,
              }))}
            />
          )}
        </div>

        <div className="card">
          <h2>Tes jours forts (moyenne, 8 semaines)</h2>
          <div className="hint">
            Pour savoir quels jours préparer plus de stock et de monnaie.
          </div>
          <BarresVerticales
            points={ordreSemaine.map((d) => {
              const p = parSemaine.find((x) => x.jourSemaine === d)!;
              return { label: JOURS[d], valeurs: [p.moyenne] };
            })}
            series={[{ nom: "Ventes moyennes", couleur: COULEURS.serie1 }]}
            hauteur={170}
          />
        </div>

        <div className="card">
          <h2>Dépenses par catégorie · {moisAnnee(year, month)}</h2>
          <div className="hint">Où part l&apos;argent qui sort.</div>
          {depensesCat.length === 0 ? (
            <div className="muted" style={{ padding: "8px 0" }}>
              Aucune dépense ce mois-ci.
            </div>
          ) : (
            <BarresHorizontales lignes={depensesCat.map((d) => ({ label: d.categorie, valeur: d.total }))} couleur={COULEURS.depense} />
          )}
        </div>

        <div className="card">
          <h2>Manques aux contrôles, 12 mois</h2>
          <div className="hint">
            La valeur qui manquait à chaque comptage. Une barre qui monte, c&apos;est un signal.
          </div>
          <BarresVerticales
            points={manques.map((p) => ({
              label: MOIS_COURT[p.mois - 1],
              valeurs: [p.manque],
              hint: moisAnnee(p.annee, p.mois),
            }))}
            series={[{ nom: "Manque", couleur: COULEURS.manque }]}
            hauteur={170}
          />
        </div>

        <div className="card">
          <h2>L&apos;argent qui dort (sans vente depuis 30 jours)</h2>
          <div className="hint">
            En stock mais plus vendu : pense promotion, ou arrête d&apos;en racheter.
          </div>
          {dormants.length === 0 ? (
            <div className="muted" style={{ padding: "8px 0" }}>
              Rien ne dort : tout ton stock a bougé ce mois-ci.
            </div>
          ) : (
            <>
              <table>
                <thead>
                  <tr>
                    <th>Produit</th>
                    <th className="num">Stock</th>
                    <th className="num">Valeur immobilisée</th>
                    <th>Dernière vente</th>
                  </tr>
                </thead>
                <tbody>
                  {dormants.map((d) => (
                    <tr key={d.id}>
                      <td className="prod">{d.nom}</td>
                      <td className="num">{d.stock}</td>
                      <td className="num">{formatCFA(d.immobilise)}</td>
                      <td className="muted">
                        {d.derniereVente ? jourCourt(d.derniereVente) : "jamais"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {nbDormants > dormants.length ? (
                <div className="note">
                  Et {nbDormants - dormants.length} autres produits dormants.
                </div>
              ) : null}
            </>
          )}
        </div>
      </div>
    </>
  );
}
