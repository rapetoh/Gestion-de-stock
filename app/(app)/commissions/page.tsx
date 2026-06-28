import { commissionsDuMois, totalCommissionsMois } from "@/lib/repo/commissions";
import { formatCFA } from "@/lib/money";
import { moisAnnee } from "@/lib/dates";
import { anneeMoisCourants } from "@/lib/periodes";
import CommissionForm from "./CommissionForm";
import CommissionsRows from "./CommissionsRows";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function dernierMois(): { value: string; label: string }[] {
  const out: { value: string; label: string }[] = [];
  const { year, month } = anneeMoisCourants();
  for (let i = 0; i < 12; i++) {
    const d = new Date(Date.UTC(year, month - 1 - i, 1));
    const y = d.getUTCFullYear();
    const m = d.getUTCMonth() + 1;
    out.push({ value: `${y}-${String(m).padStart(2, "0")}`, label: moisAnnee(y, m) });
  }
  return out;
}

export default async function CommissionsPage({
  searchParams,
}: {
  searchParams: Promise<{ mois?: string }>;
}) {
  const { mois } = await searchParams;
  const courant = anneeMoisCourants();
  let year = courant.year;
  let month = courant.month;
  if (mois && /^\d{4}-\d{2}$/.test(mois)) {
    const [y, m] = mois.split("-").map(Number);
    year = y;
    month = m;
  }

  const commissions = commissionsDuMois(year, month);
  const total = totalCommissionsMois(year, month);
  const options = dernierMois();
  const selected = `${year}-${String(month).padStart(2, "0")}`;

  return (
    <>
      <div className="topbar">
        <div>
          <h1>Commissions Mobile Money</h1>
          <div className="when">
            TMoney, Flooz, crédit… ce que le mobile money te rapporte, en plus de
            la marchandise.
          </div>
        </div>
        <div className="right">
          <form method="get">
            <select
              className="input"
              style={{ width: "auto" }}
              name="mois"
              defaultValue={selected}
            >
              {options.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>{" "}
            <button type="submit" className="btn ghost">
              Afficher
            </button>
          </form>
        </div>
      </div>

      <div
        className="grid"
        style={{ gridTemplateColumns: "420px 1fr", alignItems: "start" }}
      >
        <div className="card">
          <h2>Nouvelle commission</h2>
          <CommissionForm />
        </div>

        <div className="card">
          <h2>Commissions de {moisAnnee(year, month)}</h2>
          <div className="hint">
            Total du mois : <strong>{formatCFA(total)}</strong> — ajouté à ta
            marge dans Bénéfices.
          </div>
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Libellé</th>
                <th>Canal</th>
                <th className="num">Montant</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {commissions.length === 0 ? (
                <tr>
                  <td colSpan={5} className="muted">
                    Aucune commission ce mois-ci.
                  </td>
                </tr>
              ) : (
                <CommissionsRows commissions={commissions} />
              )}
            </tbody>
            {commissions.length > 0 ? (
              <tfoot>
                <tr>
                  <td colSpan={3}>Total</td>
                  <td className="num pos">{formatCFA(total)}</td>
                  <td></td>
                </tr>
              </tfoot>
            ) : null}
          </table>
        </div>
      </div>
    </>
  );
}
