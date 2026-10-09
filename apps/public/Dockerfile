# syntax=docker/dockerfile:1.7
# Multi-stage build for the storefront. The build context is the frontend repository root
# because the application consumes the shared workspace packages.

FROM node:22-alpine AS base
RUN apk add --no-cache dumb-init
WORKDIR /app

# ---- dependencies -------------------------------------------------------------
FROM base AS deps
COPY package.json package-lock.json ./
COPY packages/config/package.json packages/config/
COPY packages/types/package.json packages/types/
COPY packages/ui/package.json packages/ui/
COPY packages/api-client/package.json packages/api-client/
COPY apps/public/package.json apps/public/
COPY apps/admin/package.json apps/admin/
RUN npm ci --include=dev --ignore-scripts

# ---- build --------------------------------------------------------------------
FROM deps AS build
ENV NEXT_TELEMETRY_DISABLED=1
COPY tsconfig.base.json ./
COPY packages packages
COPY apps/public apps/public
# NEXT_PUBLIC_* values are inlined at build time, so they are passed as build arguments.
ARG NEXT_PUBLIC_SITE_NAME="BD Shop"
ARG NEXT_PUBLIC_SITE_URL=http://localhost:3000
ARG NEXT_PUBLIC_ADMIN_URL=http://localhost:3100
ARG NEXT_PUBLIC_CURRENCY=BDT
ARG NEXT_PUBLIC_DELIVERY_FLAT_RATE=120
ARG NEXT_PUBLIC_FREE_SHIPPING_THRESHOLD=5000
ARG NEXT_PUBLIC_SITE_LOGO=
ARG NEXT_PUBLIC_SITE_LOGO_WIDTH=120
ARG NEXT_PUBLIC_SITE_LOGO_HEIGHT=32
ARG NEXT_PUBLIC_SITE_LOGO_WITH_NAME=false
ARG NEXT_PUBLIC_OWNER_NAME=
ARG NEXT_PUBLIC_OWNER_ROLE=
ARG NEXT_PUBLIC_OWNER_IMAGE=
ENV NEXT_PUBLIC_SITE_NAME="$NEXT_PUBLIC_SITE_NAME" \
    NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL \
    NEXT_PUBLIC_ADMIN_URL=$NEXT_PUBLIC_ADMIN_URL \
    NEXT_PUBLIC_CURRENCY=$NEXT_PUBLIC_CURRENCY \
    NEXT_PUBLIC_DELIVERY_FLAT_RATE=$NEXT_PUBLIC_DELIVERY_FLAT_RATE \
    NEXT_PUBLIC_FREE_SHIPPING_THRESHOLD=$NEXT_PUBLIC_FREE_SHIPPING_THRESHOLD \
    NEXT_PUBLIC_SITE_LOGO=$NEXT_PUBLIC_SITE_LOGO \
    NEXT_PUBLIC_SITE_LOGO_WIDTH=$NEXT_PUBLIC_SITE_LOGO_WIDTH \
    NEXT_PUBLIC_SITE_LOGO_HEIGHT=$NEXT_PUBLIC_SITE_LOGO_HEIGHT \
    NEXT_PUBLIC_SITE_LOGO_WITH_NAME=$NEXT_PUBLIC_SITE_LOGO_WITH_NAME \
    NEXT_PUBLIC_OWNER_NAME="$NEXT_PUBLIC_OWNER_NAME" \
    NEXT_PUBLIC_OWNER_ROLE="$NEXT_PUBLIC_OWNER_ROLE" \
    NEXT_PUBLIC_OWNER_IMAGE=$NEXT_PUBLIC_OWNER_IMAGE
RUN npm run build --workspace @ecom/storefront

# ---- runtime ------------------------------------------------------------------
FROM base AS runtime
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0

# The standalone output already contains the server and only the modules it needs.
COPY --from=build --chown=node:node /app/apps/public/.next/standalone ./
COPY --from=build --chown=node:node /app/apps/public/.next/static ./apps/public/.next/static
COPY --from=build --chown=node:node /app/apps/public/public ./apps/public/public

USER node
EXPOSE 3000

HEALTHCHECK --interval=15s --timeout=5s --start-period=25s --retries=5 \
  CMD node -e "fetch('http://127.0.0.1:3000/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

ENTRYPOINT ["/usr/bin/dumb-init", "--"]
CMD ["node", "apps/public/server.js"]
