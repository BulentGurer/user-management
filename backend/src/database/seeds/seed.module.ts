import { Module } from '@nestjs/common';
import { AppConfigModule } from '../../config/app-config.module.js';
import { SecurityModule } from '../../security/security.module.js';
import { DatabaseModule } from '../database.module.js';
import { DemoUserSeeder } from './demo-user-seeder.js';

@Module({
  imports: [AppConfigModule, DatabaseModule, SecurityModule],
  providers: [DemoUserSeeder],
})
export class SeedModule {}
