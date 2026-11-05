/**
 * Entry point for the TypeORM CLI (migration:generate, migration:run,
 * migration:revert). It runs outside Nest, so it loads and validates the
 * environment itself, with the same rules as the application.
 */
import { existsSync } from 'node:fs';
import { DataSource } from 'typeorm';
import { validateEnv } from '../config/env.validation.js';
import { buildDataSourceOptions } from './database.options.js';

// Same file as the application uses (see app.module.ts). In containers it
// does not exist and real environment variables are used instead.
const ENV_FILE_PATH = '../.env';

if (existsSync(ENV_FILE_PATH)) {
  // Values already present in the environment are not overwritten.
  process.loadEnvFile(ENV_FILE_PATH);
}

export default new DataSource(buildDataSourceOptions(validateEnv(process.env)));
