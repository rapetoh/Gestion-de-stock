import { listActivite } from "@/lib/repo/activite";
import { formatCFA } from "@/lib/money";
import { jourCourt, heure } from "@/lib/dates";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ACTIONS: { value: string; label: string; cls: string }[] = [
  { value: "", label: "Tout", cls: "pay" },
  { value: "creation", label: "Création", cls: "ok" },
  { value: "modification", label: "Modification", cls: "warn" },
  { value: "suppression", label: "Suppression", cls: "bad" },
  { value: "controle", label: "Contrôle", cls: "pay" },
  { value: "soldes", label: "Soldes", cls: "pay" },
  { value: "connexion", label: "Connexion", cls: "pay" },
];

const ENTITES: Record<string, string> = {
  vente: "Vente",
  achat: "Achat",
  produit: "Produit",
  depense: "Dépense",
  controle: "Contrôle",
  soldes: "Soldes",
  session: "Session",
};

function badge(action: string) {
  const a = ACTIONS.find((x) => x.value === action);
  return <span className={`badge ${a?.cls ?? "pay"}`}>{a?.label ?? action}</span>;
}

export default async function ActivitePage({
  searchParams,
}: {
  searchParams: Promise<{ action?: string; jour?: string }>;
}) {
  const { action, jour } = await searchParams;
  const lignes = listActivite({
    action: action || undefined,
    jour: jour || undefined,
    limit: 200,
  });

  return (
    <>
      <div className="topbar">
        <div>
          <h1>Activité</h1>
          <div className="when">
            Qui a fait quoi, et quand. La trace de tout ce qui se passe dans
            l&apos;application.
          </div>
        </div>
        <div className="right">
          <form method="get" style={{ display: "flex", gap: 8 }}>
            <select className="input" name="action" defaultValue={action ?? ""} style={{ width: "auto" }}>
              {ACTIONS.map((a) => (
                <option key={a.value} value={a.value}>
                  {a.label}
                </option>
              ))}
            </select>
            <input
              className="input"
              type="date"
              name="jour"
              defaultValue={jour ?? ""}
              style={{ width: "auto" }}
            />
            <button type="submit" className="btn ghost">
              Filtrer
            </button>
          </form>
        </div>
      </div>

      <div className="card">
        <div className="hint">
          {lignes.length} action{lignes.length > 1 ? "s" : ""} affichée
          {lignes.length > 1 ? "s" : ""} (les plus récentes en premier).
        </div>
        <table>
          <thead>
            <tr>
              <th>Quand</th>
              <th>Qui</th>
              <th>Action</th>
              <th>Quoi</th>
              <th>Détails</th>
              <th className="num">Montant</th>
            </tr>
          </thead>
          <tbody>
            {lignes.length === 0 ? (
              <tr>
                <td colSpan={6} className="muted">
                  Aucune activité pour ce filtre.
                </td>
              </tr>
            ) : (
              lignes.map((l) => (
                <tr key={l.id}>
                  <td className="muted">
                    {jourCourt(l.date)} {heure(l.date)}
                  </td>
                  <td>{l.user_nom ?? "—"}</td>
                  <td>{badge(l.action)}</td>
                  <td className="muted">{l.entite ? ENTITES[l.entite] ?? l.entite : "—"}</td>
                  <td>{l.details}</td>
                  <td className="num">
                    {l.montant != null ? formatCFA(l.montant) : "—"}
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
