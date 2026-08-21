# syntax=docker/dockerfile:1

FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN --mount=type=cache,target=/root/.npm npm ci --ignore-scripts

FROM deps AS build
COPY . .
RUN npm run build

FROM node:22-alpine AS production
ENV NODE_ENV=production \
    HOST=0.0.0.0 \
    PORT=3013
WORKDIR /app

COPY --chown=node:node --from=build /app/dist ./dist
COPY --chown=node:node server.mjs ./server.mjs

USER node

EXPOSE 3013

HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
  CMD wget -qO- http://127.0.0.1:3013/health || exit 1

CMD ["node", "server.mjs"]