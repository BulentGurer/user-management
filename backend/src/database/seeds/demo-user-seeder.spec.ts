import type { ConfigService } from '@nestjs/config';
import type { DataSource, EntityManager } from 'typeorm';
import type { EnvironmentVariables } from '../../config/env.validation.js';
import type { PasswordHasher } from '../../security/password-hasher.js';
import { User } from '../../users/entities/user.entity.js';
import { UserRole } from '../../users/user-role.enum.js';
import { DemoUserSeeder } from './demo-user-seeder.js';
import { DEMO_USERS } from './demo-users.js';

const DEMO_PASSWORD = 'demo-password';

describe('DemoUserSeeder', () => {
  let manager: {
    count: ReturnType<typeof vi.fn>;
    insert: ReturnType<typeof vi.fn>;
  };
  let hashCount: number;

  function createSeeder(env: Partial<EnvironmentVariables>): DemoUserSeeder {
    const dataSource = {
      transaction: (work: (manager: EntityManager) => Promise<unknown>) =>
        work(manager as unknown as EntityManager),
    } as unknown as DataSource;
    const hasher: PasswordHasher = {
      hash: (plain) => Promise.resolve(`hashed:${plain}:${++hashCount}`),
      verify: () => Promise.resolve(true),
    };
    const config = {
      get: (key: keyof EnvironmentVariables) => env[key],
    } as unknown as ConfigService<EnvironmentVariables, true>;

    return new DemoUserSeeder(dataSource, hasher, config);
  }

  beforeEach(() => {
    manager = { count: vi.fn(), insert: vi.fn() };
    hashCount = 0;
  });

  it('does nothing when seeding is disabled', async () => {
    const seeder = createSeeder({ SEED_DEMO_USERS: false });

    await expect(seeder.seed()).resolves.toBe(0);
    expect(manager.count).not.toHaveBeenCalled();
    expect(manager.insert).not.toHaveBeenCalled();
  });

  it('does not touch a table that already has users', async () => {
    manager.count.mockResolvedValue(1);
    const seeder = createSeeder({
      SEED_DEMO_USERS: true,
      SEED_DEMO_PASSWORD: DEMO_PASSWORD,
    });

    await expect(seeder.seed()).resolves.toBe(0);
    expect(manager.insert).not.toHaveBeenCalled();
  });

  it('inserts every demo user with a hashed password into an empty table', async () => {
    manager.count.mockResolvedValue(0);
    const seeder = createSeeder({
      SEED_DEMO_USERS: true,
      SEED_DEMO_PASSWORD: DEMO_PASSWORD,
    });

    await expect(seeder.seed()).resolves.toBe(DEMO_USERS.length);

    const [entity, inserted] = manager.insert.mock.calls[0] as [
      typeof User,
      Partial<User>[],
    ];
    expect(entity).toBe(User);
    expect(inserted.map((user) => user.username)).toEqual(
      DEMO_USERS.map((user) => user.username),
    );
    for (const user of inserted) {
      expect(user.passwordHash).toMatch(/^hashed:demo-password:/);
    }
    // One hash per user, so each one gets its own salt.
    expect(new Set(inserted.map((user) => user.passwordHash)).size).toBe(
      DEMO_USERS.length,
    );
  });

  it('seeds at least two admins so the last-admin rule can be tried', () => {
    const admins = DEMO_USERS.filter((user) => user.role === UserRole.Admin);

    expect(admins.length).toBeGreaterThanOrEqual(2);
  });

  it('uses only lowercase demo usernames', () => {
    for (const user of DEMO_USERS) {
      expect(user.username).toBe(user.username.toLowerCase());
    }
  });
});
