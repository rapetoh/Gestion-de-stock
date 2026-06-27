export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default function DepensesPage() {
  return (
    <>
      <div className="topbar">
        <div>
          <h1>Dépenses</h1>
          <div className="when">
            Loyer, salaire, transport, taxes… tout ce qui sort de la caisse.
          </div>
        </div>
      </div>
      <div className="card">
        <h2>Bientôt disponible</h2>
        <div className="hint">
          La gestion des dépenses arrive dans une prochaine étape.
        </div>
      </div>
    </>
  );
}
