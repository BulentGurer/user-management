#!/bin/sh
# Container start: bring the schema up to date, seed demo users (only into an
# empty table, and only if SEED_DEMO_USERS=true), then start the API.
# Any failing step stops the container instead of serving a broken API.
set -eu

node node_modules/typeorm/cli.js migration:run --dataSource dist/database/data-source.js
node dist/database/seeds/seed.js

# exec: the API replaces this shell, so it receives stop signals directly
# and shuts down cleanly on "docker compose down".
exec node dist/main.js
