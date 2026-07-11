"use client";

// Champ de recherche de la page Aide : filtre les questions pendant la frappe.
// Tout est rendu côté serveur ; ici on ne fait que montrer/cacher (et ouvrir les
// questions qui correspondent). Accents ignorés : « depense » trouve « Dépense ».

function normalise(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
}

export default function AideFiltre() {
  function filtrer(q: string) {
    const n = normalise(q.trim());
    const actif = n.length >= 2;
    const liste = document.getElementById("aide-liste");
    if (!liste) return;
    for (const section of Array.from(liste.querySelectorAll<HTMLElement>("[data-section]"))) {
      let visibles = 0;
      for (const item of Array.from(section.querySelectorAll<HTMLDetailsElement>("details.aide-item"))) {
        const ok = !actif || normalise(item.textContent ?? "").includes(n);
        item.style.display = ok ? "" : "none";
        item.open = actif && ok;
        if (ok) visibles++;
      }
      section.style.display = visibles ? "" : "none";
    }
  }

  return (
    <div className="field" style={{ marginBottom: 14 }}>
      <input
        className="input big"
        placeholder="Cherche ta question… ex : supprimer, crédit, mot de passe"
        onChange={(e) => filtrer(e.target.value)}
        autoComplete="off"
        aria-label="Chercher dans l'aide"
      />
    </div>
  );
}
