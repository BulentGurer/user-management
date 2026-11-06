import type { ConfigService } from '@nestjs/config';
import type { JwtModuleOptions } from '@nestjs/jwt';
import { durationToSeconds } from '../config/duration.js';
import type { EnvironmentVariables } from '../config/env.validation.js';

type AppConfig = ConfigService<EnvironmentVariables, true>;

/** HMAC with SHA-256, pinned on both sides so no other algorithm is accepted. */
const JWT_ALGORITHM = 'HS256';

/**
 * How long an access token is valid, in seconds. The one place that reads
 * JWT_EXPIRES_IN: tokens are signed with it and clients are told about it.
 */
export function accessTokenTtlSeconds(config: AppConfig): number {
  return durationToSeconds(config.get('JWT_EXPIRES_IN', { infer: true }));
}

/** Signing and verification settings for the access tokens. */
export function accessTokenOptions(config: AppConfig): JwtModuleOptions {
  return {
    secret: config.get('JWT_SECRET', { infer: true }),
    signOptions: {
      algorithm: JWT_ALGORITHM,
      expiresIn: accessTokenTtlSeconds(config),
    },
    verifyOptions: { algorithms: [JWT_ALGORITHM] },
  };
}
