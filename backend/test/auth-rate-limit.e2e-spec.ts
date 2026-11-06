import type { INestApplication } from '@nestjs/common';
import { getOptionsToken } from '@nestjs/throttler';
import request from 'supertest';
import { TOO_MANY_LOGIN_ATTEMPTS_MESSAGE } from '../src/auth/auth.module.js';
import { UserRole } from '../src/users/user-role.enum.js';
import {
  clearUsers,
  createTestApp,
  createUser,
  type TestUser,
} from './setup/test-app.js';

const LIMIT = 3;
const ONE_MINUTE_MS = 60_000;

describe('Sign-in rate limit (e2e)', () => {
  let app: INestApplication;
  let user: TestUser;

  const http = () => request(app.getHttpServer());
  const login = (password: string, forwardedFor?: string) => {
    const req = http().post('/api/auth/login');
    if (forwardedFor) {
      req.set('X-Forwarded-For', forwardedFor);
    }
    return req.send({ username: user.username, password });
  };

  beforeEach(async () => {
    // A fresh application per test, so every test starts with empty counters.
    app = await createTestApp((builder) =>
      builder.overrideProvider(getOptionsToken()).useValue({
        throttlers: [{ limit: LIMIT, ttl: ONE_MINUTE_MS }],
        errorMessage: TOO_MANY_LOGIN_ATTEMPTS_MESSAGE,
      }),
    );
    await clearUsers(app);
    user = await createUser(app, 'mehmet.demir', UserRole.User);
  });

  afterEach(async () => {
    await app.close();
  });

  it('answers 429 once the limit is used up, even with the right password', async () => {
    for (let attempt = 0; attempt < LIMIT; attempt++) {
      await login('wrong-password').expect(401);
    }

    const response = await login(user.password).expect(429);

    expect((response.body as { message: string }).message).toBe(
      TOO_MANY_LOGIN_ATTEMPTS_MESSAGE,
    );
    expect(response.headers['retry-after']).toBeDefined();
  });

  it('cannot be bypassed with a made-up X-Forwarded-For header', async () => {
    // No proxy is trusted by default, so the header must be ignored.
    for (let attempt = 0; attempt < LIMIT; attempt++) {
      await login('wrong-password', `203.0.113.${attempt}`).expect(401);
    }

    await login(user.password, '198.51.100.7').expect(429);
  });

  it('limits only sign-in, not the rest of the API', async () => {
    for (let attempt = 0; attempt < LIMIT; attempt++) {
      await login('wrong-password').expect(401);
    }

    await http().get('/api/health').expect(200);
  });
});
