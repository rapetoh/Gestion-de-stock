import Link from "next/link";
import { listProduits } from "@/lib/repo/produits";
import { listControles } from "@/lib/repo/controle";
import { formatCFA } from "@/lib/money";
import { jourCourt, heure } from "@/lib/dates";
import ControleForm from "./ControleForm";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default function ControlePage() {
  const produits = listProduits();
  const controles = listControles(10);

  return (
    <>
      <div className="topbar">
        <div>
          <h1>Contrôle de stock</h1>
          <div className="when">
            Compte ce qu&apos;il y a vraiment sur l&apos;étagère. L&apos;app te
            dira où ça cloche.
          </div>
        </div>
      </div>

      <ControleForm produits={produits} />

      <div className="section-gap"></div>

      <div className="card">
        <h2>Contrôles récents</h2>
        <div className="hint">
          Chaque contrôle garde l&apos;écart trouvé — utile pour suivre les
          manques dans le temps.
        </div>
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Note</th>
              <th className="num">Produits comptés</th>
              <th className="num">Manque</th>
              <th className="num">En trop</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {controles.length === 0 ? (
              <tr>
                <td colSpan={6} className="muted">
                  Aucun contrôle pour l&apos;instant.
                </td>
              </tr>
            ) : (
              controles.map((c) => (
                <tr key={c.id}>
                  <td className="muted">
                    {jourCourt(c.date)} {heure(c.date)}
                  </td>
                  <td>{c.note ?? "—"}</td>
                  <td className="num">{c.nb_produits}</td>
                  <td className={`num ${c.manque > 0 ? "neg" : ""}`}>
                    {c.manque > 0 ? formatCFA(c.manque) : "—"}
                  </td>
                  <td className={`num ${c.surplus > 0 ? "pos" : ""}`}>
                    {c.surplus > 0 ? formatCFA(c.surplus) : "—"}
                  </td>
                  <td className="num">
                    <Link href={`/controle/${c.id}`} className="btn ghost">
                      Voir
                    </Link>
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
