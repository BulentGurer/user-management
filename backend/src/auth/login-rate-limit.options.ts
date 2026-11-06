import type { ConfigService } from '@nestjs/config';
import type { ThrottlerModuleOptions } from '@nestjs/throttler';
import { durationToMilliseconds } from '../config/duration.js';
import type { EnvironmentVariables } from '../config/env.validation.js';

export const TOO_MANY_LOGIN_ATTEMPTS_MESSAGE =
  'Too many sign-in attempts. Please wait a moment and try again.';

export interface LoginRateLimit {
  /** Attempts allowed per client IP address within one window. */
  limit: number;
  windowMs: number;
}

/**
 * Counts requests per client IP address. It applies only where ThrottlerGuard
 * is used: the sign-in route (see AuthController). The counters are kept in
 * memory, which is enough for one API instance; several instances would
 * share a store such as Redis.
 */
export function buildLoginRateLimitOptions({
  limit,
  windowMs,
}: LoginRateLimit): ThrottlerModuleOptions {
  return {
    throttlers: [{ limit, ttl: windowMs }],
    errorMessage: TOO_MANY_LOGIN_ATTEMPTS_MESSAGE,
  };
}

/** The limit configured through LOGIN_RATE_LIMIT and LOGIN_RATE_LIMIT_WINDOW. */
export function loginRateLimitOptions(
  config: ConfigService<EnvironmentVariables, true>,
): ThrottlerModuleOptions {
  return buildLoginRateLimitOptions({
    limit: config.get('LOGIN_RATE_LIMIT', { infer: true }),
    windowMs: durationToMilliseconds(
      config.get('LOGIN_RATE_LIMIT_WINDOW', { infer: true }),
    ),
  });
}
