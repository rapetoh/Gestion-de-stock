import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Image de production autonome : `next build` émet .next/standalone/server.js
  // avec seulement les dépendances nécessaires. C'est ce que copie le Dockerfile.
  output: "standalone",
};

export default nextConfig;
