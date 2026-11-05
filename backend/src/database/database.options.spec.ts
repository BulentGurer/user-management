import { User } from '../users/entities/user.entity.js';
import { buildDataSourceOptions } from './database.options.js';

const env = {
  DB_HOST: '127.0.0.1',
  DB_PORT: 5432,
  DB_NAME: 'user_management',
  DB_USER: 'user_management',
  DB_PASSWORD: 'test-password',
};

describe('buildDataSourceOptions', () => {
  const options = buildDataSourceOptions(env);

  it('connects to postgres with the configured values', () => {
    expect(options).toMatchObject({
      type: 'postgres',
      host: env.DB_HOST,
      port: env.DB_PORT,
      database: env.DB_NAME,
      username: env.DB_USER,
      password: env.DB_PASSWORD,
    });
  });

  it('never lets TypeORM change the schema on its own', () => {
    expect(options.synchronize).toBe(false);
    expect(options.migrationsRun).toBe(false);
  });

  it('registers the entities and at least one migration', () => {
    expect(options.entities).toContain(User);
    expect(options.migrations).not.toHaveLength(0);
  });
});
