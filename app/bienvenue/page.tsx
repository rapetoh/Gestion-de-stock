import Link from "next/link";

export const metadata = {
  title: "Mon Panier · Boutique & Mobile Money à Lomé",
  description:
    "Mon Panier, la boutique de quartier à Lomé : alimentation, hygiène, boissons et Mobile Money (TMoney, Flooz).",
};

// La vitrine publique : la seule page que voit un visiteur qui n'est pas de la
// maison. Une identité, une phrase, une porte. Tout le reste est privé.
export default function BienvenuePage() {
  return (
    <main className="landing">
      <div className="landing-halo" aria-hidden />
      <div className="landing-halo landing-halo-2" aria-hidden />

      <section className="landing-hero">
        <div className="landing-mark" aria-hidden>
          {/* Un panier tressé, dessiné à la main : l'enseigne. */}
          <svg viewBox="0 0 96 96" width="88" height="88" role="img" aria-label="Panier">
            <g
              fill="none"
              stroke="currentColor"
              strokeWidth="4.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              {/* l'anse */}
              <path d="M30 40 C30 18, 66 18, 66 40" opacity="0.9" />
              {/* le corps du panier */}
              <path d="M18 42 L78 42 L70 78 C69.5 81 67 83 64 83 L32 83 C29 83 26.5 81 26 78 Z" />
              {/* le tressage */}
              <path d="M36 42 L39.5 83" opacity="0.55" />
              <path d="M48 42 L48 83" opacity="0.55" />
              <path d="M60 42 L56.5 83" opacity="0.55" />
              <path d="M22.5 56 L73.5 56" opacity="0.55" />
              <path d="M25.5 69 L70.5 69" opacity="0.55" />
            </g>
          </svg>
        </div>

        <p className="landing-lieu">Lomé · Togo</p>
        <h1 className="landing-nom">
          Mon <span>Panier</span>
        </h1>
        <p className="landing-phrase">
          La boutique du quartier, tenue au carré : chaque vente, chaque franc,
          chaque jour. Alimentation, hygiène, boissons &amp; Mobile Money.
        </p>

        <Link href="/connexion" className="landing-cta">
          Entrer dans la boutique
          <svg
            viewBox="0 0 24 24"
            width="20"
            height="20"
            aria-hidden
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M5 12h14" />
            <path d="M13 6l6 6-6 6" />
          </svg>
        </Link>

        <p className="landing-note">Espace privé, réservé à l&apos;équipe de la boutique.</p>
      </section>

      <footer className="landing-pied">
        <span>Mon Panier</span>
        <span aria-hidden>·</span>
        <span>TMoney &amp; Flooz acceptés</span>
      </footer>
    </main>
  );
}
