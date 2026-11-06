# syntax=docker/dockerfile:1

# Builds the Angular app (production configuration by default).
FROM node:26.13.0-alpine3.24 AS build
WORKDIR /app
COPY package.json package-lock.json .npmrc ./
RUN npm ci
COPY angular.json tsconfig.json tsconfig.app.json ./
COPY public ./public
COPY src ./src
RUN npm run build

# nginx serves the static files and forwards /api to the backend, so the
# browser talks to a single origin and no CORS configuration is needed.
FROM nginx:1.30.6-alpine AS runtime
COPY nginx/default.conf /etc/nginx/conf.d/default.conf
COPY nginx/security-headers.conf /etc/nginx/snippets/security-headers.conf
COPY --from=build /app/dist/user-management-web/browser /usr/share/nginx/html
EXPOSE 80
HEALTHCHECK --interval=10s --timeout=5s --retries=5 \
  CMD wget -q -O /dev/null http://127.0.0.1/ || exit 1
