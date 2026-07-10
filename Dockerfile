# syntax=docker/dockerfile:1

# ── Build stage ───────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

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

# ── Runtime stage (static files served by Nginx) ──────────────────────────────
FROM nginx:1.27-alpine AS production

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://127.0.0.1/healthz >/dev/null 2>&1 || exit 1

CMD ["nginx", "-g", "daemon off;"]
