import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { UserRole } from '../src/users/user-role.enum.js';
import {
  clearUsers,
  createTestApp,
  createUser,
  loginAs,
  type TestUser,
} from './setup/test-app.js';

describe('Authentication (e2e)', () => {
  let app: INestApplication;
  let user: TestUser;

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    await clearUsers(app);
    user = await createUser(app, 'mehmet.demir', UserRole.User);
  });

  it('logs in case-insensitively and returns a bearer token', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ username: 'Mehmet.Demir', password: user.password })
      .expect(200);

    expect(response.body).toMatchObject({
      tokenType: 'Bearer',
      expiresIn: expect.any(Number) as number,
      accessToken: expect.any(String) as string,
    });
  });

  it.each([
    ['a wrong password', 'mehmet.demir', 'wrong-password'],
    ['an unknown username', 'nobody', 'any-password'],
  ])(
    'rejects %s with the same generic message',
    async (_case, username, password) => {
      const response = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ username, password })
        .expect(401);

      expect(response.body).toMatchObject({ message: 'Invalid credentials' });
    },
  );

  it('returns the current user without the password hash', async () => {
    const token = await loginAs(app, user);

    const response = await request(app.getHttpServer())
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(response.body).toEqual({
      id: user.id,
      username: 'mehmet.demir',
      fullName: 'Test mehmet.demir',
      role: UserRole.User,
    });
  });

  it('requires a token for every route that is not public', async () => {
    await request(app.getHttpServer()).get('/api/auth/me').expect(401);
    await request(app.getHttpServer()).get('/api/users').expect(401);
  });
});
