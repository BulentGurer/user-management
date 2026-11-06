import type { ConfigService } from '@nestjs/config';
import type { EnvironmentVariables } from '../config/env.validation.js';
import {
  loginRateLimitOptions,
  TOO_MANY_LOGIN_ATTEMPTS_MESSAGE,
} from './login-rate-limit.options.js';

describe('loginRateLimitOptions', () => {
  it('reads the limit and converts the window to milliseconds', () => {
    const values: Partial<EnvironmentVariables> = {
      LOGIN_RATE_LIMIT: 5,
      LOGIN_RATE_LIMIT_WINDOW: '30s',
    };
    const config = {
      get: (key: keyof EnvironmentVariables) => values[key],
    } as unknown as ConfigService<EnvironmentVariables, true>;

    expect(loginRateLimitOptions(config)).toEqual({
      throttlers: [{ limit: 5, ttl: 30_000 }],
      errorMessage: TOO_MANY_LOGIN_ATTEMPTS_MESSAGE,
    });
  });
});
