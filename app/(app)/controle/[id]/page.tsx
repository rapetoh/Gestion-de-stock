import Link from "next/link";
import { notFound } from "next/navigation";
import { getControle } from "@/lib/repo/controle";
import { formatCFA } from "@/lib/money";
import { jourCourt, heure } from "@/lib/dates";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function ControleDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const data = getControle(Number(id));
  if (!data) notFound();

  const { controle, lignes } = data;
  const manque = lignes
    .filter((l) => l.ecart < 0)
    .reduce((s, l) => s + -l.valeur_ecart, 0);
  const surplus = lignes
    .filter((l) => l.ecart > 0)
    .reduce((s, l) => s + l.valeur_ecart, 0);

  return (
    <>
      <div className="topbar">
        <div>
          <h1>Contrôle du {jourCourt(controle.date)} {heure(controle.date)}</h1>
          <div className="when">{controle.note ?? "Sans note."}</div>
        </div>
        <Link href="/controle" className="btn ghost">
          ← Retour
        </Link>
      </div>

      <div className="card">
        <div className="calcbox" style={{ marginBottom: 14 }}>
          <div className="calcline">
            <span>Produits comptés</span>
            <span>{lignes.length}</span>
          </div>
          <div className="calcline">
            <span>En trop</span>
            <span className="pos">{formatCFA(surplus)}</span>
          </div>
          <div className="calcline total">
            <span>Manque (vol/perte ?)</span>
            <span className="neg">{formatCFA(manque)}</span>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>Produit</th>
              <th className="num">Théorique</th>
              <th className="num">Compté</th>
              <th className="num">Écart</th>
              <th className="num">Valeur</th>
            </tr>
          </thead>
          <tbody>
            {lignes.map((l) => (
              <tr key={l.id}>
                <td className="prod">{l.nom}</td>
                <td className="num muted">{l.theorique}</td>
                <td className="num">{l.compte}</td>
                <td className="num">
                  {l.ecart < 0 ? (
                    <span className="badge bad">manque {Math.abs(l.ecart)}</span>
                  ) : l.ecart > 0 ? (
                    <span className="badge warn">+{l.ecart} en trop</span>
                  ) : (
                    <span className="badge ok">juste</span>
                  )}
                </td>
                <td
                  className={`num ${
                    l.ecart < 0 ? "neg" : l.ecart > 0 ? "pos" : ""
                  }`}
                >
                  {l.ecart !== 0 ? formatCFA(l.valeur_ecart) : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
