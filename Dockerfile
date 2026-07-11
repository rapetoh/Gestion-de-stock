# Ma Boutique — image de production.
# Node 24 : `node:sqlite` (base de données) exige Node >= 22.5. bcryptjs est du JS pur
# (aucune compilation native), donc l'image « slim » suffit.

# 1) Dépendances -------------------------------------------------------------
FROM node:24-slim AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# 2) Build -------------------------------------------------------------------
FROM node:24-slim AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# 3) Exécution (image finale, minimale) --------------------------------------
FROM node:24-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
# La base vit sur le volume monté (voir fly.toml : /data). JAMAIS dans l'image.
ENV MABOUTIQUE_DB=/data/maboutique.db
# server.js (sortie « standalone ») doit écouter sur toutes les interfaces.
ENV HOSTNAME=0.0.0.0
ENV PORT=3000

# Sortie autonome : le serveur + juste les dépendances utiles, les fichiers
# statiques, et le dossier public.
COPY --from=build /app/.next/standalone ./
COPY --from=build /app/.next/static ./.next/static
COPY --from=build /app/public ./public

EXPOSE 3000
CMD ["node", "server.js"]
