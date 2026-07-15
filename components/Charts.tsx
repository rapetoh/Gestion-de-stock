// Graphiques rendus côté serveur (SVG + HTML pur), dans le système de design de
// l'app : aucune bibliothèque, rien à charger, et ils s'impriment tels quels dans
// le rapport PDF. Palette catégorielle validée (contraste et daltonisme) :
// vert #0e9163, bleu #2a78d6, orange #d97706, violet #8a63d2. Les valeurs sont
// écrites directement sur ou à côté des barres : lisible au doigt sur téléphone,
// sans survol nécessaire.
import { formatCFA } from "@/lib/money";

export const COULEURS = {
  serie1: "#0e9163",
  serie2: "#2a78d6",
  depense: "#b45309",
  manque: "#b3402f",
  paiements: {
    especes: "#0e9163",
    tmoney: "#2a78d6",
    flooz: "#d97706",
    credit: "#8a63d2",
  } as Record<string, string>,
};

// Format court pour l'axe : 1 250 000 -> "1,25 M" ; 250 000 -> "250 k" ; 800 -> "800".
export function fmtCourt(n: number): string {
  if (n >= 1_000_000) {
    const m = n / 1_000_000;
    return `${(Math.round(m * 100) / 100).toLocaleString("fr-FR")} M`;
  }
  if (n >= 1_000) return `${Math.round(n / 1_000).toLocaleString("fr-FR")} k`;
  return String(n);
}

// Plafond « propre » pour l'axe : 1, 2, 2.5 ou 5 × 10^k juste au-dessus du max.
function plafond(max: number): number {
  if (max <= 0) return 1;
  const puissance = Math.pow(10, Math.floor(Math.log10(max)));
  for (const m of [1, 2, 2.5, 5, 10]) {
    if (m * puissance >= max) return m * puissance;
  }
  return 10 * puissance;
}

// Barre à sommet arrondi (4px), carrée à la ligne de base.
function barrePath(x: number, y: number, w: number, h: number): string {
  const r = Math.min(4, h, w / 2);
  return [
    `M ${x} ${y + h}`,
    `L ${x} ${y + r}`,
    `Q ${x} ${y} ${x + r} ${y}`,
    `L ${x + w - r} ${y}`,
    `Q ${x + w} ${y} ${x + w} ${y + r}`,
    `L ${x + w} ${y + h}`,
    "Z",
  ].join(" ");
}

export type SerieDef = { nom: string; couleur: string };
export type PointBarres = { label: string; valeurs: number[]; hint?: string };

// Colonnes (1 ou 2 séries, groupées), axe Y à graduations propres, grille en trait
// fin, étiquettes de valeur SÉLECTIVES : le maximum et le dernier point seulement.
export function BarresVerticales({
  points,
  series,
  hauteur = 190,
  labelChaque = 1,
}: {
  points: PointBarres[];
  series: SerieDef[];
  hauteur?: number;
  labelChaque?: number; // n'écrire qu'une étiquette d'axe X sur n
}) {
  const W = 600;
  const gauche = 48;
  const bas = 20;
  const haut = 16;
  const plotW = W - gauche - 6;
  const plotH = hauteur - haut - bas;

  const maxVal = Math.max(1, ...points.flatMap((p) => p.valeurs));
  const top = plafond(maxVal);
  const y = (v: number) => haut + plotH - (v / top) * plotH;

  const slot = plotW / points.length;
  const nbS = series.length;
  const barW = Math.min(24, Math.max(3, (slot - 4 - 2 * (nbS - 1)) / nbS));
  const groupeW = nbS * barW + (nbS - 1) * 2;

  // Étiquettes sélectives : l'indice du max (série 1) et le dernier point.
  const idxMax = points.reduce(
    (best, p, i) => (p.valeurs[0] > points[best].valeurs[0] ? i : best),
    0
  );
  const aEtiquette = (i: number) => i === idxMax || i === points.length - 1;

  return (
    <div className="chart-scroll">
      <svg
        viewBox={`0 0 ${W} ${hauteur}`}
        width="100%"
        style={{ minWidth: 480, display: "block" }}
        role="img"
      >
        {[0, 0.5, 1].map((t) => (
          <g key={t}>
            <line
              x1={gauche}
              x2={W - 6}
              y1={y(top * t)}
              y2={y(top * t)}
              stroke="var(--line)"
              strokeWidth="1"
            />
            <text
              x={gauche - 6}
              y={y(top * t) + 4}
              textAnchor="end"
              fontSize="11"
              fill="var(--ink-soft)"
            >
              {fmtCourt(top * t)}
            </text>
          </g>
        ))}
        {points.map((p, i) => {
          const x0 = gauche + i * slot + (slot - groupeW) / 2;
          return (
            <g key={i}>
              {p.valeurs.map((v, s) => {
                const h = Math.max(0, ((v / top) * plotH));
                const xb = x0 + s * (barW + 2);
                return (
                  <path
                    key={s}
                    d={barrePath(xb, y(v), barW, h)}
                    fill={series[s].couleur}
                  >
                    <title>
                      {(p.hint ?? p.label) +
                        (nbS > 1 ? ` (${series[s].nom})` : "") +
                        " : " +
                        formatCFA(v)}
                    </title>
                  </path>
                );
              })}
              {aEtiquette(i) && p.valeurs[0] > 0 ? (
                <text
                  x={x0 + groupeW / 2}
                  y={y(Math.max(...p.valeurs)) - 5}
                  textAnchor="middle"
                  fontSize="11"
                  fontWeight="700"
                  fill="var(--ink)"
                >
                  {fmtCourt(p.valeurs[0])}
                </text>
              ) : null}
              {i % labelChaque === 0 ? (
                <text
                  x={x0 + groupeW / 2}
                  y={hauteur - 5}
                  textAnchor="middle"
                  fontSize="10.5"
                  fill="var(--ink-soft)"
                >
                  {p.label}
                </text>
              ) : null}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

// Légende (obligatoire dès 2 séries ; inutile pour une seule).
export function Legende({ series }: { series: SerieDef[] }) {
  return (
    <div className="chart-legende">
      {series.map((s) => (
        <span key={s.nom}>
          <i style={{ background: s.couleur }} /> {s.nom}
        </span>
      ))}
    </div>
  );
}

export type LigneH = {
  label: string;
  valeur: number;
  couleur?: string;
  sous?: string; // complément discret : « 12 vendus », « 34 % »…
};

// Barres horizontales (classements, répartitions) : libellé, barre fine, valeur au bout.
export function BarresHorizontales({
  lignes,
  couleur = COULEURS.serie1,
}: {
  lignes: LigneH[];
  couleur?: string;
}) {
  const max = Math.max(1, ...lignes.map((l) => l.valeur));
  return (
    <div className="hbars">
      {lignes.map((l) => (
        <div
          className="hb-row"
          key={l.label}
          title={`${l.label} : ${formatCFA(l.valeur)}`}
        >
          <div className="hb-label">
            {l.label}
            {l.sous ? <span className="hb-sous">{l.sous}</span> : null}
          </div>
          <div className="hb-track">
            <div
              className="hb-fill"
              style={{
                width: `${Math.max(l.valeur > 0 ? 1.5 : 0, (l.valeur / max) * 100)}%`,
                background: l.couleur ?? couleur,
              }}
            />
          </div>
          <div className="hb-val">{formatCFA(l.valeur)}</div>
        </div>
      ))}
    </div>
  );
}
