import { NodeEnvironment, validateEnv } from './env.validation.js';

const validEnv = {
  DB_HOST: '127.0.0.1',
  DB_NAME: 'user_management',
  DB_USER: 'user_management',
  DB_PASSWORD: 'test-password',
  JWT_SECRET: 'a'.repeat(32),
};

describe('validateEnv', () => {
  it('applies defaults for optional variables', () => {
    const env = validateEnv(validEnv);

    expect(env.NODE_ENV).toBe(NodeEnvironment.Development);
    expect(env.PORT).toBe(3000);
    expect(env.DB_PORT).toBe(5432);
    expect(env.JWT_EXPIRES_IN).toBe('1h');
  });

  it('converts numeric strings to numbers', () => {
    const env = validateEnv({ ...validEnv, PORT: '8080', DB_PORT: '6543' });

    expect(env.PORT).toBe(8080);
    expect(env.DB_PORT).toBe(6543);
  });

  it('fails fast when JWT_SECRET is missing', () => {
    const { JWT_SECRET: _omitted, ...withoutSecret } = validEnv;

    expect(() => validateEnv(withoutSecret)).toThrow(/JWT_SECRET/);
  });

  it('rejects a JWT_SECRET shorter than 32 characters', () => {
    expect(() =>
      validateEnv({ ...validEnv, JWT_SECRET: 'a'.repeat(31) }),
    ).toThrow(/JWT_SECRET must be longer than or equal to 32 characters/);
  });

  it('rejects a non-numeric DB_PORT', () => {
    expect(() => validateEnv({ ...validEnv, DB_PORT: 'abc' })).toThrow(
      /DB_PORT/,
    );
  });

  it('rejects an unknown NODE_ENV', () => {
    expect(() => validateEnv({ ...validEnv, NODE_ENV: 'staging' })).toThrow(
      /NODE_ENV/,
    );
  });

  it('rejects an invalid JWT_EXPIRES_IN', () => {
    expect(() =>
      validateEnv({ ...validEnv, JWT_EXPIRES_IN: 'one hour' }),
    ).toThrow(/JWT_EXPIRES_IN/);
  });

  it('reports every invalid variable at once', () => {
    const { DB_HOST: _host, JWT_SECRET: _secret, ...incomplete } = validEnv;

    const message = errorMessageOf(() => validateEnv(incomplete));

    expect(message).toContain('DB_HOST');
    expect(message).toContain('JWT_SECRET');
  });

  it('never includes secret values in the error message', () => {
    const shortSecret = 'too-short-secret';

    const message = errorMessageOf(() =>
      validateEnv({ ...validEnv, JWT_SECRET: shortSecret }),
    );

    expect(message).not.toContain(shortSecret);
  });
});

function errorMessageOf(action: () => unknown): string {
  try {
    action();
  } catch (error) {
    return (error as Error).message;
  }
  throw new Error('Expected the action to throw');
}
