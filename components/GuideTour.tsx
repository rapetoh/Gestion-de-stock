"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname } from "next/navigation";

// Petit tour guidé au premier login (et rejouable depuis Aide via /?guide=1).
// Il surligne un élément du menu quand c'est possible, sinon affiche une carte centrée
// (ex : sur téléphone, le menu est un tiroir fermé). Aucune donnée serveur : un simple
// drapeau localStorage retient qu'il a déjà été vu.

type Step = { titre: string; corps: string; cible?: string };

const OWNER: Step[] = [
  {
    titre: "Bienvenue dans Ma Boutique 👋",
    corps:
      "Ce petit guide te montre l'essentiel en 30 secondes. Tu pourras le revoir quand tu veux depuis le bouton Aide.",
  },
  {
    titre: "Tes produits",
    corps:
      "Ici tu ajoutes ce que tu vends. Tu peux tout importer d'un coup depuis un fichier Excel enregistré en CSV.",
    cible: '[data-tour="/produits"]',
  },
  {
    titre: "Vendre",
    corps:
      "Choisis le produit, encaisse. Pas besoin d'ouvrir une caisse — le stock baisse tout seul.",
    cible: '[data-tour="/ventes"]',
  },
  {
    titre: "Contrôle de stock",
    corps:
      "Compte ce qu'il y a vraiment sur l'étagère. L'app te dit où ça cloche, en F CFA (perte ou vol).",
    cible: '[data-tour="/controle"]',
  },
  {
    titre: "Soldes du jour",
    corps:
      "Caisse + TMoney + Flooz : chaque soir, l'app te dit si tout l'argent est là.",
    cible: '[data-tour="/soldes"]',
  },
  {
    titre: "Sauvegarde",
    corps:
      "Garde une copie de tout, en lieu sûr. Si l'ordinateur tombe en panne, rien n'est perdu.",
    cible: '[data-tour="/sauvegarde"]',
  },
  {
    titre: "Besoin d'aide plus tard ?",
    corps:
      "Clique sur Aide, en bas du menu. Tout y est expliqué, et tu peux même l'imprimer.",
    cible: '[data-tour="/aide"]',
  },
];

const VENDEUSE: Step[] = [
  {
    titre: "Bienvenue 👋",
    corps: "Voici tes deux écrans. C'est rapide, tu ne peux rien casser.",
  },
  {
    titre: "Vendre",
    corps:
      "Choisis le produit et encaisse (espèces, TMoney, Flooz ou crédit). Le stock baisse tout seul.",
    cible: '[data-tour="/ventes"]',
  },
  {
    titre: "Stock",
    corps: "Regarde ce qu'il reste sur les étagères. En rouge = fini ou presque.",
    cible: '[data-tour="/stock"]',
  },
  {
    titre: "Un souci ?",
    corps: "Le bouton Aide t'explique tout, en mots simples.",
    cible: '[data-tour="/aide"]',
  },
];

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(v, hi));

export default function GuideTour({ role }: { role: string }) {
  const steps = role === "proprietaire" ? OWNER : VENDEUSE;
  // Drapeau par rôle : sur un même ordinateur, la propriétaire et la vendeuse ont chacune
  // droit à leur propre tour la 1re fois.
  const flagKey = `maboutique_guide_v1_${role}_done`;
  const pathname = usePathname();
  const [active, setActive] = useState(false);
  const [i, setI] = useState(0);
  const [rect, setRect] = useState<DOMRect | null>(null);

  // Démarrage au 1er login (drapeau localStorage absent). On lance après la peinture (rAF) :
  // le 1er rendu reste identique au serveur (rien), donc pas de décalage d'hydratation, et
  // setState n'est pas synchrone dans l'effet.
  useEffect(() => {
    let done = false;
    try {
      done = localStorage.getItem(flagKey) === "1";
    } catch {}
    if (done) return;
    const id = requestAnimationFrame(() => {
      setI(0);
      setActive(true);
    });
    return () => cancelAnimationFrame(id);
  }, [flagKey]);

  // Rejeu depuis Aide : le lien « Revoir le guide » mène à /?guide=1 (le pathname change).
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (new URLSearchParams(window.location.search).get("guide") !== "1") return;
    const id = requestAnimationFrame(() => {
      setI(0);
      setActive(true);
    });
    return () => cancelAnimationFrame(id);
  }, [pathname]);

  // Position du surlignage (recalculée au changement d'étape, au resize et au scroll).
  useEffect(() => {
    if (!active) return;
    const maj = () => {
      const sel = steps[i]?.cible;
      const el = sel ? document.querySelector(sel) : null;
      if (el) {
        const r = el.getBoundingClientRect();
        const visible =
          r.width > 0 && r.right > 4 && r.left < window.innerWidth - 4;
        setRect(visible ? r : null);
      } else {
        setRect(null);
      }
    };
    maj();
    window.addEventListener("resize", maj);
    window.addEventListener("scroll", maj, true);
    return () => {
      window.removeEventListener("resize", maj);
      window.removeEventListener("scroll", maj, true);
    };
  }, [active, i, steps]);

  const terminer = useCallback(() => {
    setActive(false);
    try {
      localStorage.setItem(flagKey, "1");
    } catch {}
  }, [flagKey]);

  if (!active || !steps[i]) return null;
  const step = steps[i];
  const dernier = i === steps.length - 1;

  const cardStyle: React.CSSProperties = rect
    ? {
        top: clamp(rect.top, 12, window.innerHeight - 250),
        left: clamp(rect.right + 16, 12, Math.max(12, window.innerWidth - 346)),
      }
    : { top: "50%", left: "50%", transform: "translate(-50%,-50%)" };

  return (
    <>
      <div className="guide-catch" />
      {rect ? (
        <div
          className="guide-ring"
          style={{
            top: rect.top - 6,
            left: rect.left - 6,
            width: rect.width + 12,
            height: rect.height + 12,
          }}
        />
      ) : (
        <div className="guide-dim" />
      )}
      <div className="guide-card" style={cardStyle} role="dialog" aria-modal="true">
        <div className="guide-step">
          Étape {i + 1} / {steps.length}
        </div>
        <h3 className="guide-title">{step.titre}</h3>
        <p className="guide-body">{step.corps}</p>
        <div className="guide-actions">
          <button type="button" className="btn ghost" onClick={terminer}>
            Passer
          </button>
          <div style={{ display: "flex", gap: 8 }}>
            {i > 0 ? (
              <button type="button" className="btn ghost" onClick={() => setI(i - 1)}>
                Précédent
              </button>
            ) : null}
            {dernier ? (
              <button type="button" className="btn primary" onClick={terminer}>
                Terminer
              </button>
            ) : (
              <button type="button" className="btn primary" onClick={() => setI(i + 1)}>
                Suivant
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
