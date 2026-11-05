import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DataSource } from 'typeorm';
import type { EnvironmentVariables } from '../../config/env.validation.js';
import { PasswordHasher } from '../../security/password-hasher.js';
import { User } from '../../users/entities/user.entity.js';
import { DEMO_USERS } from './demo-users.js';

/**
 * Inserts the demo users, but only into an empty users table: restarting the
 * stack must not bring back users that an admin has deleted.
 */
@Injectable()
export class DemoUserSeeder {
  private readonly logger = new Logger(DemoUserSeeder.name);

  constructor(
    private readonly dataSource: DataSource,
    private readonly passwordHasher: PasswordHasher,
    private readonly config: ConfigService<EnvironmentVariables, true>,
  ) {}

  /** Returns the number of users inserted. */
  async seed(): Promise<number> {
    if (!this.config.get('SEED_DEMO_USERS', { infer: true })) {
      this.logger.log('Demo user seeding is disabled (SEED_DEMO_USERS=false)');
      return 0;
    }

    return this.dataSource.transaction(async (manager) => {
      const existingUsers = await manager.count(User);
      if (existingUsers > 0) {
        this.logger.log(
          `Skipped: the users table already has ${existingUsers} user(s)`,
        );
        return 0;
      }

      const users = await this.buildDemoUsers();
      await manager.insert(User, users);
      this.logger.log(`Seeded ${users.length} demo users`);
      return users.length;
    });
  }

  private async buildDemoUsers(): Promise<Partial<User>[]> {
    // Validation guarantees the password exists whenever seeding is enabled.
    const password = this.config.get('SEED_DEMO_PASSWORD', { infer: true })!;

    // Each user is hashed separately, so every user gets its own random salt.
    return Promise.all(
      DEMO_USERS.map(async (demoUser) => ({
        ...demoUser,
        passwordHash: await this.passwordHasher.hash(password),
      })),
    );
  }
}
