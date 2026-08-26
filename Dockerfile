# syntax=docker/dockerfile:1

# ── Build stage ───────────────────────────────────────────────────────────────
FROM node:22-alpine AS builder

WORKDIR /app

# VITE_* vars are inlined into the bundle at build time, so they must be present
# during `vite build`. CI passes them per environment via --build-arg.
ARG VITE_API_BASE_URL
ARG VITE_PAYMENTS_ENABLED=true
ARG VITE_CLOUDINARY_CLOUD_NAME
ARG VITE_CLOUDINARY_UPLOAD_PRESET
ARG VITE_CLOUDINARY_FOLDER_PREFIX
ARG VITE_GOOGLE_MAPS_API_KEY

ENV VITE_API_BASE_URL=$VITE_API_BASE_URL \
    VITE_PAYMENTS_ENABLED=$VITE_PAYMENTS_ENABLED \
    VITE_CLOUDINARY_CLOUD_NAME=$VITE_CLOUDINARY_CLOUD_NAME \
    VITE_CLOUDINARY_UPLOAD_PRESET=$VITE_CLOUDINARY_UPLOAD_PRESET \
    VITE_CLOUDINARY_FOLDER_PREFIX=$VITE_CLOUDINARY_FOLDER_PREFIX \
    VITE_GOOGLE_MAPS_API_KEY=$VITE_GOOGLE_MAPS_API_KEY

COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile

COPY . .
RUN yarn build

# ── Runtime stage (Node static server + social OG for /offer/:id) ─────────────
FROM node:22-alpine AS production

WORKDIR /app

RUN apk add --no-cache wget

# Runtime API base for Open Graph crawler fetches (staging vs prod).
ARG OG_API_BASE_URL
ARG SITE_ORIGIN=https://acheteici.com
ENV OG_API_BASE_URL=${OG_API_BASE_URL} \
    SITE_ORIGIN=${SITE_ORIGIN} \
    PORT=80 \
    HOST=0.0.0.0 \
    NODE_ENV=production

COPY --from=builder /app/dist ./dist
COPY server ./server

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://127.0.0.1/healthz >/dev/null 2>&1 || exit 1

CMD ["node", "server/staticServer.mjs"]
