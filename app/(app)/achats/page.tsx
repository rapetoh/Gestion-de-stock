import Link from "next/link";
import { listAchats, listAchatsDuJour } from "@/lib/repo/achats";
import { jourCourt } from "@/lib/dates";
import AchatForm from "./AchatForm";
import AchatsRows from "./AchatsRows";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function AchatsPage({
  searchParams,
}: {
  searchParams: Promise<{ jour?: string }>;
}) {
  const params = await searchParams;
  // Sans date choisie : les 20 plus récents. Avec une date : tous les achats de ce jour,
  // pour retrouver et corriger une entrée qui a quitté la fenêtre récente.
  const jour = /^\d{4}-\d{2}-\d{2}$/.test(params.jour ?? "") ? params.jour! : null;
  const achats = jour ? listAchatsDuJour(jour) : listAchats(20);

  return (
    <>
      <div className="topbar">
        <div>
          <h1>Achats</h1>
          <div className="when">
            Enregistre un produit qui arrive, du fournisseur ou du marché.
          </div>
        </div>
      </div>

      <div
        className="grid"
        style={{ gridTemplateColumns: "420px 1fr", alignItems: "start" }}
      >
        <div className="card">
          <h2>Enregistrer un achat</h2>
          <div className="hint">
            Tape le nom du produit. S&apos;il existe déjà, il se complète tout
            seul. Sinon il sera créé.
          </div>
          <AchatForm />
        </div>

        <div className="card">
          <div className="topbar" style={{ marginBottom: 0 }}>
            <h2>
              {jour
                ? `Achats du ${jourCourt(`${jour}T12:00:00.000Z`)}`
                : "Derniers achats"}
            </h2>
            <form method="get" className="right">
              <input
                className="input"
                type="date"
                name="jour"
                defaultValue={jour ?? ""}
                style={{ width: "auto" }}
              />{" "}
              <button type="submit" className="btn ghost">
                Afficher
              </button>
            </form>
          </div>
          <div className="hint">
            {jour ? (
              <>
                {achats.length === 0
                  ? "Aucun achat ce jour-là."
                  : `${achats.length} achat${achats.length > 1 ? "s" : ""} ce jour-là.`}{" "}
                <Link className="lien" href="/achats">
                  Revenir aux plus récents
                </Link>
              </>
            ) : (
              "Les 20 plus récents. Pour un jour passé, choisis la date."
            )}
          </div>
          <div className="achat-liste">
            {achats.length === 0 && !jour ? (
              <div className="muted" style={{ padding: "10px 2px" }}>
                Aucun achat enregistré pour l&apos;instant.
              </div>
            ) : (
              <AchatsRows achats={achats} />
            )}
          </div>
          <div className="note">
            Aucun code-barres obligatoire. Tu retrouves tout par le nom.
          </div>
        </div>
      </div>
    </>
  );
}
