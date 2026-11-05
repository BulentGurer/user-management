// class-transformer reads decorator type metadata through the Reflect API.
import 'reflect-metadata';
import { plainToInstance, Transform } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsString,
  Matches,
  Max,
  Min,
  MinLength,
  ValidateIf,
  validateSync,
} from 'class-validator';
import { PASSWORD_MIN_LENGTH } from '../users/user.constraints.js';

export enum NodeEnvironment {
  Development = 'development',
  Production = 'production',
  Test = 'test',
}

const MIN_PORT = 1;
const MAX_PORT = 65535;
// HS256 needs a key of at least 256 bits (32 bytes).
const MIN_JWT_SECRET_LENGTH = 32;
// A number followed by a unit: s, m, h or d (for example 15m, 1h, 7d).
const DURATION_PATTERN = /^\d+[smhd]$/;

/**
 * Accepts only "true" and "false". Implicit conversion would turn the string
 * "false" into true (any non-empty string is truthy); other values are kept
 * as they are so that @IsBoolean reports them. The raw value is read from
 * the source object because `value` has already been implicitly converted.
 */
function toStrictBoolean({
  obj,
  key,
}: {
  obj: Record<string, unknown>;
  key: string;
}): unknown {
  const raw = obj[key];
  if (raw === 'true' || raw === true) return true;
  if (raw === 'false' || raw === false) return false;
  return raw;
}

export class EnvironmentVariables {
  @IsEnum(NodeEnvironment)
  NODE_ENV: NodeEnvironment = NodeEnvironment.Development;

  @IsInt()
  @Min(MIN_PORT)
  @Max(MAX_PORT)
  PORT: number = 3000;

  @IsString()
  @IsNotEmpty()
  DB_HOST: string;

  @IsInt()
  @Min(MIN_PORT)
  @Max(MAX_PORT)
  DB_PORT: number = 5432;

  @IsString()
  @IsNotEmpty()
  DB_NAME: string;

  @IsString()
  @IsNotEmpty()
  DB_USER: string;

  @IsString()
  @IsNotEmpty()
  DB_PASSWORD: string;

  @IsString()
  @MinLength(MIN_JWT_SECRET_LENGTH)
  JWT_SECRET: string;

  @Matches(DURATION_PATTERN, {
    message: 'JWT_EXPIRES_IN must be a duration such as 15m, 1h or 7d',
  })
  JWT_EXPIRES_IN: string = '1h';

  /** Seeds demo users into an empty database. Never enable in production. */
  @Transform(toStrictBoolean, { toClassOnly: true })
  @IsBoolean({ message: 'SEED_DEMO_USERS must be true or false' })
  SEED_DEMO_USERS: boolean = false;

  /** Shared password of the demo users; required only when seeding them. */
  @ValidateIf((env: EnvironmentVariables) => env.SEED_DEMO_USERS === true)
  @IsString()
  @MinLength(PASSWORD_MIN_LENGTH)
  SEED_DEMO_PASSWORD?: string;
}

/**
 * Validates the raw environment once at startup. Any problem stops the
 * application before it can serve requests (fail fast). Error messages
 * name the variable and the rule, never the value, so secrets do not leak
 * into logs.
 */
export function validateEnv(
  config: Record<string, unknown>,
): EnvironmentVariables {
  const env = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });
  const errors = validateSync(env);

  if (errors.length > 0) {
    const problems = errors.flatMap((error) =>
      Object.values(error.constraints ?? {}),
    );
    throw new Error(
      `Invalid environment configuration:\n  - ${problems.join('\n  - ')}`,
    );
  }

  return env;
}
