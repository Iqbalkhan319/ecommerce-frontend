# syntax=docker/dockerfile:1.7
FROM node:22-alpine AS base
RUN apk add --no-cache dumb-init
WORKDIR /app

FROM base AS deps
COPY package.json package-lock.json ./
COPY packages/config/package.json packages/config/
COPY packages/types/package.json packages/types/
COPY packages/ui/package.json packages/ui/
COPY packages/api-client/package.json packages/api-client/
COPY apps/public/package.json apps/public/
COPY apps/admin/package.json apps/admin/
RUN npm ci --include=dev --ignore-scripts

FROM deps AS build
ENV NEXT_TELEMETRY_DISABLED=1
COPY tsconfig.base.json ./
COPY packages packages
COPY apps/admin apps/admin
ARG NEXT_PUBLIC_SITE_NAME="BD Shop"
ARG NEXT_PUBLIC_SITE_URL=http://localhost:3100
ARG NEXT_PUBLIC_ADMIN_URL=http://localhost:3100
ARG NEXT_PUBLIC_CURRENCY=BDT
ARG NEXT_PUBLIC_DELIVERY_FLAT_RATE=120
ARG NEXT_PUBLIC_FREE_SHIPPING_THRESHOLD=5000
ENV NEXT_PUBLIC_SITE_NAME="$NEXT_PUBLIC_SITE_NAME" \
    NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL \
    NEXT_PUBLIC_ADMIN_URL=$NEXT_PUBLIC_ADMIN_URL \
    NEXT_PUBLIC_CURRENCY=$NEXT_PUBLIC_CURRENCY \
    NEXT_PUBLIC_DELIVERY_FLAT_RATE=$NEXT_PUBLIC_DELIVERY_FLAT_RATE \
    NEXT_PUBLIC_FREE_SHIPPING_THRESHOLD=$NEXT_PUBLIC_FREE_SHIPPING_THRESHOLD
RUN npm run build --workspace @ecom/admin-app

FROM base AS runtime
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 PORT=3100 HOSTNAME=0.0.0.0
COPY --from=build --chown=node:node /app/apps/admin/.next/standalone ./
COPY --from=build --chown=node:node /app/apps/admin/.next/static ./apps/admin/.next/static
COPY --from=build --chown=node:node /app/apps/admin/public ./apps/admin/public
USER node
EXPOSE 3100
ENTRYPOINT ["/usr/bin/dumb-init", "--"]
CMD ["node", "apps/admin/server.js"]
