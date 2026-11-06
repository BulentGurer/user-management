# User Management

[![CI](https://github.com/BulentGurer/user-management/actions/workflows/ci.yml/badge.svg)](https://github.com/BulentGurer/user-management/actions/workflows/ci.yml)

A small user management module: a NestJS REST API, an Angular single-page app and a PostgreSQL
database. Users sign in with a username and password and get a JWT. Admins manage users; standard
users can see who is in the system.

[Türkçe](README.tr.md)

## Features

- **Sign in** with username and password. The API returns a short-lived JWT access token.
- **Two roles**
  - **Admin**: list, view, create, edit and delete users.
  - **Standard user**: sees the user list, with full names only.
- **Business rules**, enforced by the API (the UI only hides what a role cannot use):
  - There is always at least one admin: the last admin can be neither deleted nor demoted, even
    when two admins try it at the same time.
  - Admins cannot delete their own account.
  - Usernames are unique regardless of case and are stored in lowercase.
- **API documentation** with Swagger UI, a **health endpoint**, **security headers** (including a
  Content Security Policy) and a **rate limit on sign-in**.
- **Tests** for the business rules, authentication and authorization (unit and end-to-end against a
  real PostgreSQL database), and for the Angular guards, interceptor, services and pages.
- **One command to run everything** with Docker Compose, and **CI** on GitHub Actions (lint, unit
  and end-to-end tests, builds, Docker images).

## Tech stack

| Part | Choice |
|---|---|
| Runtime | Node.js 26.13 (LTS) |
| API | NestJS 12, TypeORM 1 (migrations only), class-validator, argon2id, Swagger |
| Web | Angular 22 (standalone components, signals, zoneless), Angular Material 22 |
| Database | PostgreSQL 18 |
| Language | TypeScript 6.0 |
| Tests and linting | Vitest, Supertest, oxlint, angular-eslint, Prettier |
| Containers | Docker Compose, nginx 1.30 |

All versions are pinned: exact versions in `package.json`, committed lock files, `npm ci` in the
images and full image tags.

## Quick start with Docker

Requirements: Docker with Docker Compose.

```bash
cp .env.example .env
docker compose up --build
```

Then open <http://localhost:8080>. The API documentation is at <http://localhost:8080/api/docs>.

On start the API container runs the database migrations, seeds the demo users (only into an empty
database) and then starts the API. Restarting keeps your changes; to start again from the demo
data, remove the database volume:

```bash
docker compose down -v
```

### Demo users

All demo users share the password from `SEED_DEMO_PASSWORD` in `.env` (`Demo.Pass.2026` in
`.env.example`).

| Username | Full name | Role |
|---|---|---|
| `admin` | System Admin | admin |
| `ayse.yilmaz` | Ayşe Yılmaz | admin |
| `mehmet.demir` | Mehmet Demir | standard user |
| `zeynep.kaya` | Zeynep Kaya | standard user |
| `can.ozturk` | Can Öztürk | standard user |

There are two admins so that the "last admin" rule can be tried out.

## Manual setup

Requirements: Node.js 26.13 (see `.nvmrc`) and PostgreSQL 18. The database can also come from
Docker on its own: `docker compose up -d db`.

```bash
cp .env.example .env      # one file for the API and Docker Compose
```

API (<http://localhost:3000/api>):

```bash
cd backend
npm ci
npm run build
npm run migration:run
npm run seed
npm run start:dev
```

Web app (<http://localhost:4200>; the dev server forwards `/api` to the API):

```bash
cd frontend
npm ci
npm start
```

## Configuration

Everything is configured through environment variables, read from the root `.env` file. The API
validates them at startup and refuses to start if one is missing or invalid.

| Variable | Purpose | Default |
|---|---|---|
| `NODE_ENV` | `development`, `production` or `test` | `development` |
| `PORT` | API port | `3000` |
| `WEB_PORT` | Host port of the web app (Docker Compose) | `8080` |
| `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` | Database connection | port `5432` |
| `JWT_SECRET` | Signing key of the access tokens, at least 32 characters | required |
| `JWT_EXPIRES_IN` | Token lifetime, such as `15m`, `1h` or `7d` | `1h` |
| `SEED_DEMO_USERS` | Seed the demo users into an empty database | `false` (`true` in Compose) |
| `SEED_DEMO_PASSWORD` | Password of the demo users, required when seeding | |
| `LOGIN_RATE_LIMIT` | Sign-in attempts per client IP address and window | `10` |
| `LOGIN_RATE_LIMIT_WINDOW` | Length of that window, such as `30s` or `1m` | `1m` |
| `TRUST_PROXY_HOPS` | Reverse proxies in front of the API whose `X-Forwarded-For` is trusted | `0` (`1` in Compose) |

## API

All routes are under `/api`. Every route except sign-in, health and the docs needs an
`Authorization: Bearer <token>` header.

| Method and path | Who | Description |
|---|---|---|
| `POST /api/auth/login` | everyone | Exchanges a username and password for an access token |
| `GET /api/auth/me` | signed in | The signed-in user |
| `GET /api/users` | signed in | All users: full rows for admins, id and full name for standard users |
| `GET /api/users/:id` | admin | One user, with creation and update times |
| `POST /api/users` | admin | Creates a user |
| `PATCH /api/users/:id` | admin | Changes the given fields; the password only if a new one is sent |
| `DELETE /api/users/:id` | admin | Deletes a user permanently |
| `GET /api/health` | everyone | API and database status |
| `GET /api/docs` | everyone | Swagger UI |

Errors use the usual status codes: `400` invalid input, `401` not signed in or wrong credentials,
`403` not allowed, `404` no such user, `409` username taken or last admin, `429` too many sign-in
attempts.

## Tests

```bash
cd backend
npm test              # unit tests
npm run test:e2e      # end-to-end tests, need PostgreSQL (see below)
npm run lint

cd ../frontend
npm test -- --watch=false
npm run lint
```

The end-to-end tests run the real application against a separate database,
`user_management_test`, on the server configured in `.env`. They create it if it does not exist
and bring it up to date with the migrations, so `docker compose up -d db` is enough.

## Project structure

```
backend/                NestJS API
  src/auth/             sign-in, JWT guard, roles guard, decorators
  src/users/            users controller, service, DTOs, business rules
  src/database/         TypeORM options, migrations, demo seed
  src/config/           environment validation
  src/security/         password hashing
  src/health/           health endpoint
  test/                 end-to-end tests
frontend/               Angular app
  src/app/core/         API clients, authentication, guards, interceptor
  src/app/features/     pages: login, user list, detail, form
  src/app/shared/       role badge, confirmation dialog
  src/app/layout/       header
  nginx/                nginx configuration of the web image
docker-compose.yml      db, api and web
.github/workflows/      CI
```

## Design decisions

Each entry: what was chosen, why, and what it costs.

**"View user details" is read as "more than the list".** The requirements say that standard users
can only see the list, while viewing a user's details is for admins. So the list response depends
on the caller: standard users get only id and full name from the API (not just hidden in the UI),
admins also get username and role, and the admin-only detail page adds the creation and update
times. Usernames are half of a credential and the admin list is a list of targets, so neither is
sent to every user.

**The token says who you are, the database says what you may do.** The JWT carries only the user
id. The user and their role are loaded on every request, so a deleted user or a demoted admin loses
access at once instead of when the token expires. Cost: one primary-key lookup per request.

**Deny by default.** A global guard requires a valid token on every route; public routes opt out
with `@Public()`. A second global guard checks `@Roles()`. A forgotten decorator therefore fails
closed. A missing or invalid token gives `401`, a missing role `403`.

**The last admin is protected with a row lock.** Demoting or deleting an admin runs in a transaction
that first locks all admin rows (`SELECT ... FOR UPDATE`, in id order, so two requests never
deadlock), then checks that another admin remains. Without the lock, two admins demoting each other
at the same time would both succeed and leave none; the end-to-end tests show exactly that when the
lock is removed. Cost: changes to admins are serialized, which is fine at this scale.

**The database enforces the rules too.** Named constraints guarantee unique, lowercase usernames and
valid roles. A duplicate username is detected from the unique constraint violation (`409`), not by
checking first and inserting later, which would race.

**Schema changes only through migrations.** `synchronize` is off; every change is a versioned
migration. In Docker the migrations run as a separate step before the API starts.

**Passwords: argon2id behind an interface.** Services depend on a `PasswordHasher` abstraction, so
the algorithm can change without touching them. Sign-in takes the same time for unknown users and
wrong passwords (a dummy hash is verified) and always answers "Invalid credentials", so it does not
reveal which usernames exist. Passwords are limited to 128 characters, because hashing very long
inputs is a cheap denial-of-service.

**Never return the password hash.** The service works with entities; controllers map them to
response DTOs that are built field by field, so a new column can never leak by accident.

**Configuration fails fast.** Environment variables are validated at startup; the API does not
start with a missing or short `JWT_SECRET`. Error messages name the variable and the rule, never
the value.

**One origin, no CORS.** In development the Angular dev server forwards `/api` to the API; in Docker
nginx does. The browser only ever talks to its own origin.

**The token is stored in `localStorage`.** Simple, and it survives a page reload. The trade-off: a
script injected through an XSS bug could read it, which an `httpOnly` cookie would prevent. A cookie,
on the other hand, would need CSRF protection, and the API would have to handle it. Angular escapes template
output by default, nginx sends a strict Content Security Policy (no inline scripts, no other
origins), and tokens are short-lived.

**Sign-in is rate limited per IP address.** After `LOGIN_RATE_LIMIT` attempts within the window the
API answers `429`, against password guessing. Behind nginx the client address comes from
`X-Forwarded-For`, but only as many proxy hops as `TRUST_PROXY_HOPS` are trusted, so a client
cannot reset its counter with a made-up header (covered by a test). The counters live in memory,
which suits a single API instance; several instances would share a store such as Redis.

**Security headers on both servers.** helmet sets them on API responses. nginx sets them on the web
app, because that is the HTML page the browser runs: a Content Security Policy that allows only this
origin and no inline scripts, `X-Content-Type-Options`, `Referrer-Policy` and frame protection.
Angular's critical CSS inlining is turned off for this, since it loads the stylesheet with an
inline script.

**The UI hides, the API decides.** Admin actions are not rendered for standard users, but only for
convenience: every rule is checked by the API.

**Small abstractions at the boundaries.** In the web app, components depend on `TokenStorage`,
`UsersApi` and `ConfirmationService` rather than on `localStorage`, `HttpClient` or `MatDialog`,
which keeps them simple to test.

**Swagger is generated from the code.** The Nest CLI plugin turns DTO types, validation rules and
comments into the API documentation. The docs are public so that reviewers can try the API; a real
deployment would protect or disable them.

**No external requests from the browser.** Fonts and icons are bundled with the app instead of
being loaded from a CDN.

**Containers.** Multi-stage builds keep compilers and dev dependencies out of the runtime images;
the API runs as an unprivileged user. Compose starts the services in order using health checks:
database, then API, then web.

## Future work

- Refresh tokens, so access tokens can be even shorter-lived.
- Pagination, search and sorting on the user list.
- An audit log of who changed what.
- Browser end-to-end tests (for example with Playwright).
- Translations (English and Turkish).
