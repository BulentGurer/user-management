import { defineConfig } from 'vitest/config';
import { TEST_DATABASE_NAME } from './test/setup/test-database.js';

export default defineConfig({
  resolve: { tsconfigPaths: true },
  test: {
    globals: true,
    passWithNoTests: true,
    root: './',
    include: ['test/**/*.e2e-spec.ts'],
    globalSetup: ['./test/setup/global-setup.ts'],
    // Real environment variables win over the .env file, so the application
    // under test connects to the test database.
    env: {
      NODE_ENV: 'test',
      DB_NAME: TEST_DATABASE_NAME,
      SEED_DEMO_USERS: 'false',
    },
    // The files share one database, so they must not run at the same time.
    fileParallelism: false,
    // Password hashing is deliberately slow.
    testTimeout: 20_000,
    hookTimeout: 30_000,
  },
});
