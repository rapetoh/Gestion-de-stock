"use client";

import { useState } from "react";
import type { Depense } from "@/lib/repo/depenses";
import DepenseRow from "./DepenseRow";

// Un seul éditeur ouvert à la fois ; fermeture automatique après l'enregistrement.
export default function DepensesRows({ depenses }: { depenses: Depense[] }) {
  const [editingId, setEditingId] = useState<number | null>(null);
  return (
    <>
      {depenses.map((d) => (
        <DepenseRow
          key={d.id}
          d={d}
          editing={editingId === d.id}
          onEdit={() => setEditingId(d.id)}
          onClose={() => setEditingId(null)}
        />
      ))}
    </>
  );
}
