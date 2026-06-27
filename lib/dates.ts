// Petits utilitaires de date en français — affichage humain, pas de dépendance externe.

const JOURS = [
  "Dimanche",
  "Lundi",
  "Mardi",
  "Mercredi",
  "Jeudi",
  "Vendredi",
  "Samedi",
];

const MOIS = [
  "janvier",
  "février",
  "mars",
  "avril",
  "mai",
  "juin",
  "juillet",
  "août",
  "septembre",
  "octobre",
  "novembre",
  "décembre",
];

export function dateLongue(d = new Date()): string {
  return `${JOURS[d.getDay()]} ${d.getDate()} ${MOIS[d.getMonth()]} ${d.getFullYear()}`;
}

export function moisAnnee(year: number, month: number): string {
  // month : 1–12
  const m = MOIS[month - 1] ?? "";
  return `${m.charAt(0).toUpperCase()}${m.slice(1)} ${year}`;
}

export function jourCourt(iso: string): string {
  const d = new Date(iso);
  return `${d.getDate()} ${MOIS[d.getMonth()]}`;
}

export function heure(iso: string): string {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}
