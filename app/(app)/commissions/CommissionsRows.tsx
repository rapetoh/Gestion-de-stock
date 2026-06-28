"use client";

import { useState } from "react";
import type { Commission } from "@/lib/repo/commissions";
import CommissionRow from "./CommissionRow";

// Un seul éditeur ouvert à la fois ; fermeture automatique après l'enregistrement.
export default function CommissionsRows({ commissions }: { commissions: Commission[] }) {
  const [editingId, setEditingId] = useState<number | null>(null);
  return (
    <>
      {commissions.map((c) => (
        <CommissionRow
          key={c.id}
          c={c}
          editing={editingId === c.id}
          onEdit={() => setEditingId(c.id)}
          onClose={() => setEditingId(null)}
        />
      ))}
    </>
  );
}
