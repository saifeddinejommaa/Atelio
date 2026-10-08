# ---------- Build ----------
FROM node:22-alpine AS build
WORKDIR /repo

# Dépendances d'abord (mises en cache tant que les package.json ne changent pas)
COPY package.json package-lock.json ./
COPY core/package.json core/
COPY apps/b2c/package.json apps/b2c/
COPY apps/b2b/package.json apps/b2b/
RUN npm ci

# Code source puis build de b2c
COPY core core
COPY apps/b2c apps/b2c
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build --workspace=b2c

# ---------- Runtime ----------
FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0

COPY --from=build --chown=node:node /repo/apps/b2c/.next/standalone ./
COPY --from=build --chown=node:node /repo/apps/b2c/.next/static ./apps/b2c/.next/static
COPY --from=build --chown=node:node /repo/apps/b2c/public ./apps/b2c/public

USER node
EXPOSE 3000
CMD ["node", "apps/b2c/server.js"]