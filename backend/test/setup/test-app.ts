import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { DataSource } from 'typeorm';
import { AppModule } from '../../src/app.module.js';
import { configureApp } from '../../src/app.setup.js';
import { User } from '../../src/users/entities/user.entity.js';
import { UserRole } from '../../src/users/user-role.enum.js';
import { UsersService } from '../../src/users/users.service.js';

/** The real application with the same HTTP setup as main.ts. */
export async function createTestApp(): Promise<INestApplication> {
  const moduleRef = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  const app = moduleRef.createNestApplication({ logger: false });
  configureApp(app);
  // Listen once on a free port. Otherwise supertest starts and stops the
  // server for every request, which breaks requests that overlap (such as
  // the concurrency tests, or a login inside another request's arguments).
  await app.listen(0, '127.0.0.1');
  return app;
}

/** Deletes every user, so each test starts from a known state. */
export async function clearUsers(app: INestApplication): Promise<void> {
  await app.get(DataSource).getRepository(User).clear();
}

export interface TestUser {
  id: string;
  username: string;
  password: string;
}

/** Creates a user through the real service (hashing included). */
export async function createUser(
  app: INestApplication,
  username: string,
  role: UserRole,
  password = `${username}-password`,
): Promise<TestUser> {
  const user = await app.get(UsersService).create({
    username,
    password,
    fullName: `Test ${username}`,
    role,
  });
  return { id: user.id, username: user.username, password };
}

/** Logs in over HTTP and returns the bearer token. */
export async function loginAs(
  app: INestApplication,
  user: Pick<TestUser, 'username' | 'password'>,
): Promise<string> {
  const response = await request(app.getHttpServer())
    .post('/api/auth/login')
    .send({ username: user.username, password: user.password })
    .expect(200);
  return (response.body as { accessToken: string }).accessToken;
}

export async function countAdmins(app: INestApplication): Promise<number> {
  return app
    .get(DataSource)
    .getRepository(User)
    .countBy({ role: UserRole.Admin });
}
