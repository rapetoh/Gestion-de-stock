export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default function ControlePage() {
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
      <div className="card">
        <h2>Bientôt disponible</h2>
        <div className="hint">
          Le contrôle de stock arrive dans une prochaine étape.
        </div>
      </div>
    </>
  );
}
