// class-transformer reads decorator type metadata through the Reflect API.
import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsString,
  Matches,
  Max,
  Min,
  MinLength,
  validateSync,
} from 'class-validator';

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
