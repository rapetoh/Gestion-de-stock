"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

// « Comment ça marche » : un petit mode d'emploi en haut de chaque écran.
// Ouvert tout seul à la PREMIÈRE visite de la page (drapeau localStorage par rôle
// et par page), puis réduit en un petit bouton toujours là : jamais perdu, jamais
// envahissant. La page Aide reste la référence complète ; ici, juste les gestes.

type Tip = { titre: string; etapes: string[] };

const TIPS: Record<string, Tip> = {
  "/produits": {
    titre: "Tes produits",
    etapes: [
      "« Ajouter un produit » : nom, prix d'achat, prix de vente, stock.",
      "Une longue liste ? Passe par « Importer » : tu vérifies l'aperçu avant d'enregistrer.",
      "Cherche par nom, filtre par catégorie ou stock bas.",
      "Un prix a changé ? Clique le produit et corrige : rien n'est figé.",
    ],
  },
  "/achats": {
    titre: "Enregistrer un achat",
    etapes: [
      "Tape le nom du produit (ou crée-le s'il est nouveau).",
      "Mets la quantité et le prix d'achat par unité.",
      "Pour les frais de transport, dis si ton chiffre est « pour tout le lot » ou « par unité » : l'app fait le calcul.",
      "La date est déjà remplie (aujourd'hui) : change-la si tu enregistres un achat d'un autre jour.",
      "Enregistre : le stock monte tout seul.",
    ],
  },
  "/ventes": {
    titre: "Encaisser une vente",
    etapes: [
      "Tape le nom du produit et choisis-le dans la liste.",
      "Mets la quantité, et ajoute d'autres produits si le client en prend plusieurs.",
      "Choisis comment il paie : espèces, TMoney, Flooz ou crédit.",
      "« Encaisser » : c'est fini, le stock baisse tout seul.",
    ],
  },
  "/stock": {
    titre: "Voir le stock",
    etapes: [
      "Tu vois ce qu'il reste de chaque produit sur l'étagère.",
      "En rouge : fini ou presque fini : pense à recommander.",
    ],
  },
  "/controle": {
    titre: "Contrôler le stock (anti-vol)",
    etapes: [
      "Compte ce qu'il y a VRAIMENT sur l'étagère, produit par produit.",
      "Tape le chiffre compté : l'app compare avec ce qu'elle attendait.",
      "S'il manque des choses, tu vois combien ça vaut en F CFA.",
      "Valide : le stock repart sur le bon chiffre.",
    ],
  },
  "/soldes": {
    titre: "Les soldes du soir",
    etapes: [
      "Compte l'argent de la caisse, lis tes soldes TMoney et Flooz.",
      "Tape les trois chiffres.",
      "L'app te dit si tout l'argent est là. Un manque qui revient, c'est un signal.",
    ],
  },
  "/commissions": {
    titre: "Commissions Mobile Money",
    etapes: [
      "Note ce que TMoney et Flooz t'ont rapporté (tes commissions).",
      "Ça s'ajoute à ton vrai bénéfice du mois.",
    ],
  },
  "/depenses": {
    titre: "Noter une dépense",
    etapes: [
      "Note chaque sortie d'argent : loyer, salaire, transport, taxes…",
      "Coche « revient chaque mois » pour le loyer ou le salaire : tapé une fois, compté chaque mois.",
      "Les dépenses se retirent de ton bénéfice.",
    ],
  },
  "/benefices": {
    titre: "Lire tes bénéfices",
    etapes: [
      "Choisis le mois en haut.",
      "Lis la dernière ligne : recette − coût de la marchandise − dépenses + commissions = ce que tu gagnes vraiment.",
    ],
  },
  "/equipe": {
    titre: "Ta vendeuse",
    etapes: [
      "Crée-lui son propre code : chaque vente portera son nom.",
      "Elle ne voit que Ventes et Stock : ni les marges, ni l'argent.",
      "Si elle part un jour : désactive-la (son historique reste).",
    ],
  },
  "/sauvegarde": {
    titre: "Sauvegarder",
    etapes: [
      "Télécharge une copie de toute ta boutique.",
      "Range-la en lieu sûr : clé USB, e-mail, Google Drive.",
      "Fais-le chaque fin de semaine : c'est ta ceinture de sécurité.",
    ],
  },
  "/stats": {
    titre: "Tes statistiques",
    etapes: [
      "Choisis le mois en haut : les cartes et les graphiques du mois suivent.",
      "Les valeurs sont écrites sur les barres, rien à survoler.",
      "« L'argent qui dort » : du stock qui ne se vend plus, pense promotion.",
      "Bouton « Rapport du mois (PDF) » : une page propre à imprimer ou à garder.",
    ],
  },
  "/activite": {
    titre: "Le journal d'activité",
    etapes: [
      "Tout ce qui s'est fait dans l'app, par qui, et à quelle heure.",
      "Un chiffre t'étonne ? Regarde ici ce qui s'est passé ce jour-là.",
    ],
  },
};

export default function GuidePage({ role }: { role: string }) {
  const pathname = usePathname();
  const tip = TIPS[pathname];
  const flagKey = `maboutique_pagetip_v1_${role}_${pathname}`;
  const [ouvert, setOuvert] = useState(false);
  const [pret, setPret] = useState(false);

  // Première visite de CETTE page : on ouvre après la peinture (rAF), comme le tour :
  // le 1er rendu reste identique au serveur, et setState n'est pas synchrone dans l'effet.
  useEffect(() => {
    if (!tip) return;
    let vu = false;
    try {
      vu = localStorage.getItem(flagKey) === "1";
    } catch {}
    const id = requestAnimationFrame(() => {
      setOuvert(!vu);
      setPret(true);
    });
    return () => cancelAnimationFrame(id);
  }, [flagKey, tip]);

  if (!tip || !pret) return null;

  const fermer = () => {
    setOuvert(false);
    try {
      localStorage.setItem(flagKey, "1");
    } catch {}
  };

  if (!ouvert) {
    return (
      <button type="button" className="pagetip-toggle" onClick={() => setOuvert(true)}>
        ? Comment ça marche
      </button>
    );
  }

  return (
    <div className="card pagetip">
      <div className="pagetip-head">
        <strong>Comment ça marche : {tip.titre}</strong>
      </div>
      <ol className="pagetip-steps">
        {tip.etapes.map((e) => (
          <li key={e}>{e}</li>
        ))}
      </ol>
      <button type="button" className="btn ghost" onClick={fermer}>
        J&apos;ai compris ✓
      </button>
    </div>
  );
}
