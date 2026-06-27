import { depensesDuMois, totalDepensesMois } from "@/lib/repo/depenses";
import { formatCFA } from "@/lib/money";
import { moisAnnee } from "@/lib/dates";
import DepenseForm from "./DepenseForm";
import DepenseRow from "./DepenseRow";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function dernierMois(): { value: string; label: string }[] {
  const out: { value: string; label: string }[] = [];
  const now = new Date();
  for (let i = 0; i < 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const y = d.getFullYear();
    const m = d.getMonth() + 1;
    out.push({ value: `${y}-${String(m).padStart(2, "0")}`, label: moisAnnee(y, m) });
  }
  return out;
}

export default async function DepensesPage({
  searchParams,
}: {
  searchParams: Promise<{ mois?: string }>;
}) {
  const { mois } = await searchParams;
  const now = new Date();
  let year = now.getFullYear();
  let month = now.getMonth() + 1;
  if (mois && /^\d{4}-\d{2}$/.test(mois)) {
    const [y, m] = mois.split("-").map(Number);
    year = y;
    month = m;
  }

  const depenses = depensesDuMois(year, month);
  const total = totalDepensesMois(year, month);
  const options = dernierMois();
  const selected = `${year}-${String(month).padStart(2, "0")}`;

  return (
    <>
      <div className="topbar">
        <div>
          <h1>Dépenses</h1>
          <div className="when">
            Loyer, salaire, transport, taxes… tout ce qui sort de la caisse.
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
          <h2>Nouvelle dépense</h2>
          <DepenseForm />
        </div>

        <div className="card">
          <h2>Dépenses de {moisAnnee(year, month)}</h2>
          <div className="hint">
            Total du mois : <strong>{formatCFA(total)}</strong> — retiré de ta
            marge dans Bénéfices.
          </div>
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Libellé</th>
                <th>Catégorie</th>
                <th className="num">Montant</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {depenses.length === 0 ? (
                <tr>
                  <td colSpan={5} className="muted">
                    Aucune dépense ce mois-ci.
                  </td>
                </tr>
              ) : (
                depenses.map((d) => <DepenseRow key={d.id} d={d} />)
              )}
            </tbody>
            {depenses.length > 0 ? (
              <tfoot>
                <tr>
                  <td colSpan={3}>Total</td>
                  <td className="num neg">{formatCFA(total)}</td>
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
