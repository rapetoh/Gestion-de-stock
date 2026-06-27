"use client";

import { useState } from "react";
import type { AchatAvecProduit } from "@/lib/repo/achats";
import AchatRow from "./AchatRow";

// Un seul éditeur ouvert à la fois ; il se ferme tout seul après l'enregistrement.
export default function AchatsRows({ achats }: { achats: AchatAvecProduit[] }) {
  const [editingId, setEditingId] = useState<number | null>(null);
  return (
    <>
      {achats.map((a) => (
        <AchatRow
          key={a.id}
          a={a}
          editing={editingId === a.id}
          onEdit={() => setEditingId(a.id)}
          onClose={() => setEditingId(null)}
        />
      ))}
    </>
  );
}
