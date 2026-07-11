import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Image de production autonome : `next build` émet .next/standalone/server.js
  // avec seulement les dépendances nécessaires. C'est ce que copie le Dockerfile.
  output: "standalone",
  experimental: {
    serverActions: {
      // L'import de produits envoie tout le fichier dans l'action serveur.
      // 1 Mo (défaut) ≈ 22 000 lignes ; 4 Mo met le plafond hors de portée (~90 000)
      // au lieu d'échouer avec une erreur opaque.
      bodySizeLimit: "4mb",
    },
  },
};

export default nextConfig;
