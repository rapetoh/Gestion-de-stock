import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { listUtilisateurs } from "@/lib/repo/utilisateurs";
import EquipeForm from "./EquipeForm";
import EquipeRow from "./EquipeRow";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function EquipePage() {
  // Réservé au propriétaire (le middleware bloque déjà, on revérifie ici).
  const session = await getSession();
  if (!session || session.role !== "proprietaire") redirect("/ventes");

  const utilisateurs = listUtilisateurs();

  return (
    <>
      <div className="topbar">
        <div>
          <h1>Équipe</h1>
          <div className="when">
            Donne à ta vendeuse son propre code. Chaque vente portera son nom, et
            elle ne touche ni aux marges, ni à l&apos;argent, ni aux suppressions.
          </div>
        </div>
      </div>

      <div className="grid" style={{ gridTemplateColumns: "420px 1fr", alignItems: "start" }}>
        <div className="card">
          <h2>Nouveau compte vendeuse</h2>
          <EquipeForm />
        </div>

        <div className="card">
          <h2>Les comptes</h2>
          <div className="hint">
            On ne supprime jamais un compte : on le désactive (l&apos;historique
            reste à son nom). Réactive-le si besoin.
          </div>
          <table>
            <thead>
              <tr>
                <th>Nom</th>
                <th>Identifiant</th>
                <th>Rôle</th>
                <th>Statut</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {utilisateurs.map((u) => (
                <EquipeRow key={u.id} u={u} />
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
