/**
 * Runs once before the end-to-end suite: creates the test database if it
 * does not exist yet and brings its schema up to date with the migrations,
 * exactly as a deployment would.
 */
import { existsSync } from 'node:fs';
import pg from 'pg';
import { DataSource } from 'typeorm';
import { validateEnv } from '../../src/config/env.validation.js';
import { buildDataSourceOptions } from '../../src/database/database.options.js';
import { TEST_DATABASE_NAME } from './test-database.js';

const ENV_FILE_PATH = '../.env';
// Every PostgreSQL server has this database; it is used to create others.
const MAINTENANCE_DATABASE = 'postgres';

export default async function globalSetup(): Promise<void> {
  if (existsSync(ENV_FILE_PATH)) {
    process.loadEnvFile(ENV_FILE_PATH);
  }
  const env = validateEnv({ ...process.env, DB_NAME: TEST_DATABASE_NAME });

  await createDatabaseIfMissing(env);

  const dataSource = new DataSource(buildDataSourceOptions(env));
  await dataSource.initialize();
  try {
    await dataSource.runMigrations();
  } finally {
    await dataSource.destroy();
  }
}

async function createDatabaseIfMissing(
  env: ReturnType<typeof validateEnv>,
): Promise<void> {
  const client = new pg.Client({
    host: env.DB_HOST,
    port: env.DB_PORT,
    user: env.DB_USER,
    password: env.DB_PASSWORD,
    database: MAINTENANCE_DATABASE,
  });
  await client.connect();
  try {
    const { rowCount } = await client.query(
      'SELECT 1 FROM pg_database WHERE datname = $1',
      [TEST_DATABASE_NAME],
    );
    if (rowCount === 0) {
      // Identifiers cannot be bound as parameters; the name is a constant.
      await client.query(`CREATE DATABASE "${TEST_DATABASE_NAME}"`);
    }
  } finally {
    await client.end();
  }
}
