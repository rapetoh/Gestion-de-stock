"use client";

import { useState } from "react";
import type { Produit } from "@/lib/repo/produits";
import ProduitRow from "./ProduitRow";

// Gère l'édition : un seul éditeur ouvert à la fois (ouvrir une ligne ferme les autres).
export default function ProduitsRows({ produits }: { produits: Produit[] }) {
  const [editingId, setEditingId] = useState<number | null>(null);
  return (
    <>
      {produits.map((p) => (
        <ProduitRow
          key={p.id}
          p={p}
          editing={editingId === p.id}
          onEdit={() => setEditingId(p.id)}
          onClose={() => setEditingId(null)}
        />
      ))}
    </>
  );
}
