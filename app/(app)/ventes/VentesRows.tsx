"use client";

import { useState } from "react";
import { heure } from "@/lib/dates";
import type { VenteAvecLignes } from "@/lib/repo/ventes";
import VenteRow from "./VenteRow";

// Un seul éditeur ouvert à la fois ; fermeture automatique après l'enregistrement.
// peutGerer : seule la propriétaire peut modifier/supprimer (la vendeuse voit en lecture).
export default function VentesRows({
  ventes,
  peutGerer,
}: {
  ventes: VenteAvecLignes[];
  peutGerer: boolean;
}) {
  const [editingId, setEditingId] = useState<number | null>(null);
  return (
    <>
      {ventes.map((v) => (
        <VenteRow
          key={v.id}
          v={v}
          heureLabel={heure(v.date)}
          peutGerer={peutGerer}
          editing={editingId === v.id}
          onEdit={() => setEditingId(v.id)}
          onClose={() => setEditingId(null)}
        />
      ))}
    </>
  );
}
