// Bornes de jour et de mois — UNE seule source pour toute l'appli.
//
// La boutique est à Lomé (Africa/Lomé = UTC+0, sans changement d'heure). On calcule donc tout
// en UTC : le « jour » et le « mois » restent les mêmes quel que soit le fuseau du serveur cloud.
// Avant, certains modules utilisaient l'heure LOCALE du serveur et d'autres l'UTC — une vente
// près de minuit pouvait tomber le mauvais jour selon la région d'hébergement. Ici, plus jamais.
//
// Toutes les bornes sont DEMI-OUVERTES : on inclut `debut`, on exclut `fin` (date >= debut AND date < fin).

export function aujourdhuiLome(): string {
  // YYYY-MM-DD du jour à Lomé (= date UTC, puisque Lomé est à UTC+0).
  return new Date().toISOString().slice(0, 10);
}

export function anneeMoisCourants(): { year: number; month: number } {
  const now = new Date();
  return { year: now.getUTCFullYear(), month: now.getUTCMonth() + 1 };
}

// Bornes [debut, fin) d'un jour donné (YYYY-MM-DD), par défaut aujourd'hui.
export function bornesJour(jour: string = aujourdhuiLome()): { debut: string; fin: string } {
  const debut = new Date(`${jour}T00:00:00.000Z`);
  const fin = new Date(debut.getTime() + 24 * 60 * 60 * 1000);
  return { debut: debut.toISOString(), fin: fin.toISOString() };
}

// Bornes [debut, fin) d'un mois (month : 1–12).
export function bornesMois(year: number, month: number): { debut: string; fin: string } {
  const debut = new Date(Date.UTC(year, month - 1, 1));
  const fin = new Date(Date.UTC(year, month, 1));
  return { debut: debut.toISOString(), fin: fin.toISOString() };
}
