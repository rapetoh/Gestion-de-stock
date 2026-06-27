export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default function SauvegardePage() {
  return (
    <>
      <div className="topbar">
        <div>
          <h1>Sauvegarde</h1>
          <div className="when">
            Garde une copie de toutes tes données, en sécurité, hors de
            l&apos;ordinateur.
          </div>
        </div>
      </div>

      <div
        className="grid"
        style={{ gridTemplateColumns: "1fr 1fr", alignItems: "start" }}
      >
        <div className="card">
          <h2>Copie complète (recommandé)</h2>
          <div className="hint">
            Télécharge <strong>toute</strong> ta boutique dans un seul fichier :
            produits, achats, ventes, dépenses, contrôles, soldes et
            l&apos;historique. Range-le en lieu sûr (clé USB, e-mail, Google
            Drive). Si l&apos;ordinateur tombe en panne, rien n&apos;est perdu.
          </div>
          <a
            href="/sauvegarde/export?type=db"
            className="btn primary big"
            style={{ display: "inline-block", marginTop: 12 }}
            download
          >
            Télécharger une copie de mes données
          </a>
          <div className="note">
            À faire régulièrement — par exemple chaque fin de semaine.
          </div>
        </div>

        <div className="card">
          <h2>Tableaux (Excel)</h2>
          <div className="hint">
            Pour consulter ou partager dans Excel. Ce ne sont pas des
            sauvegardes complètes.
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 12 }}>
            <a href="/sauvegarde/export?type=produits" className="btn ghost" download>
              Mes produits (CSV)
            </a>
            <a href="/sauvegarde/export?type=ventes" className="btn ghost" download>
              Mes ventes (CSV)
            </a>
            <a href="/sauvegarde/export?type=depenses" className="btn ghost" download>
              Mes dépenses (CSV)
            </a>
          </div>
        </div>
      </div>
    </>
  );
}
