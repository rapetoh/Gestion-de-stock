"use client";

// Filet de sécurité : si une action échoue (ex. produit supprimé dans un autre onglet), on montre
// un message calme en français et un bouton « Réessayer », jamais un écran d'erreur technique.
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="card" style={{ maxWidth: 520, margin: "40px auto", textAlign: "center" }}>
      <h2>Oups, ça n&apos;a pas marché</h2>
      <div className="hint" style={{ marginTop: 8 }}>
        Une petite erreur est arrivée. Rien n&apos;est perdu — réessaie. Si ça
        recommence, ferme puis rouvre la page.
      </div>
      <button
        type="button"
        className="btn primary big"
        style={{ marginTop: 16 }}
        onClick={() => reset()}
      >
        Réessayer
      </button>
    </div>
  );
}
