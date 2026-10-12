# ---------- Build ----------
FROM node:22-alpine AS build
WORKDIR /repo

COPY package.json package-lock.json ./
COPY core/package.json core/
COPY apps/b2c/package.json apps/b2c/
COPY apps/b2b/package.json apps/b2b/
RUN npm ci

COPY core core
COPY apps/b2b apps/b2b

# Domaine commun des marques (<slug>.<domaine>), intégré au build par Vite.
# Vide en production : les marques sont reconnues par leur domaine (current-brand.ts).
ARG VITE_BRAND_BASE_DOMAIN=
ENV VITE_BRAND_BASE_DOMAIN=$VITE_BRAND_BASE_DOMAIN
RUN npm run build --workspace=b2b

# ---------- Runtime ----------
FROM nginx:1.27-alpine AS runtime
COPY apps/b2b/nginx.conf.template /etc/nginx/templates/default.conf.template
COPY --from=build /repo/apps/b2b/dist /usr/share/nginx/html

ENV PORT=8080
EXPOSE 8080