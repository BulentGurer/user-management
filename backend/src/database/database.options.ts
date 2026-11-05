import type { DataSourceOptions } from 'typeorm';
import type { EnvironmentVariables } from '../config/env.validation.js';
import { User } from '../users/entities/user.entity.js';
import { CreateUsersTable1793913011724 } from './migrations/1793913011724-CreateUsersTable.js';

type DatabaseEnv = Pick<
  EnvironmentVariables,
  'DB_HOST' | 'DB_PORT' | 'DB_NAME' | 'DB_USER' | 'DB_PASSWORD'
>;

/**
 * Single source of truth for the database connection, shared by the Nest
 * application and the TypeORM CLI so both always see the same schema.
 *
 * Entities and migrations are listed explicitly instead of using file globs:
 * globs depend on the build output layout and do not work under ESM test
 * runners.
 */
export function buildDataSourceOptions(env: DatabaseEnv): DataSourceOptions {
  return {
    type: 'postgres',
    host: env.DB_HOST,
    port: env.DB_PORT,
    database: env.DB_NAME,
    username: env.DB_USER,
    password: env.DB_PASSWORD,
    entities: [User],
    migrations: [CreateUsersTable1793913011724],
    // The schema is changed only through reviewed, versioned migrations.
    synchronize: false,
    // Migrations are an explicit deployment step, not a side effect of
    // starting the app: several instances starting at once would race.
    migrationsRun: false,
    // gen_random_uuid() is built into PostgreSQL 13+, so no extension and no
    // CREATE EXTENSION privilege is needed.
    uuidExtension: 'pgcrypto',
    installExtensions: false,
  };
}
