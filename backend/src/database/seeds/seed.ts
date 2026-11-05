/**
 * `npm run seed`: runs once after the migrations and exits. It uses a Nest
 * application context (dependency injection without an HTTP server), so it
 * shares configuration, database and hashing code with the API.
 */
import { NestFactory } from '@nestjs/core';
import { DemoUserSeeder } from './demo-user-seeder.js';
import { SeedModule } from './seed.module.js';

const app = await NestFactory.createApplicationContext(SeedModule);
try {
  await app.get(DemoUserSeeder).seed();
} finally {
  await app.close();
}
