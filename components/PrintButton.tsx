"use client";

// Petit bouton pour imprimer la page d'aide (mémo papier à garder près de la caisse).
export default function PrintButton({ label }: { label?: string }) {
  return (
    <button type="button" className="btn ghost" onClick={() => window.print()}>
      {label ?? "🖨 Imprimer ce guide"}
    </button>
  );
}
