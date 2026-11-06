# syntax=docker/dockerfile:1

# Production dependencies only, installed exactly from the lock file.
FROM node:26.13.0-alpine3.24 AS prod-deps
WORKDIR /app
COPY package.json package-lock.json .npmrc ./
RUN npm ci --omit=dev

# Compiles TypeScript with the full (dev) dependencies.
FROM node:26.13.0-alpine3.24 AS build
WORKDIR /app
COPY package.json package-lock.json .npmrc ./
RUN npm ci
COPY nest-cli.json tsconfig.json tsconfig.build.json ./
COPY src ./src
RUN npm run build

# The runtime image: compiled code and production dependencies, no compiler,
# no tests, running as the unprivileged "node" user.
FROM node:26.13.0-alpine3.24 AS runtime
ENV NODE_ENV=production
WORKDIR /app
# package.json is needed at runtime: it declares the code as ES modules.
COPY package.json ./
COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY docker-entrypoint.sh ./
USER node
EXPOSE 3000
HEALTHCHECK --interval=10s --timeout=5s --start-period=30s --retries=5 \
  CMD wget -q -O /dev/null "http://127.0.0.1:${PORT:-3000}/api/health" || exit 1
ENTRYPOINT ["sh", "./docker-entrypoint.sh"]
