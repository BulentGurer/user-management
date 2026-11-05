import { Argon2PasswordHasher } from './argon2-password-hasher.js';

describe('Argon2PasswordHasher', () => {
  const hasher = new Argon2PasswordHasher();
  const password = 'correct-horse-battery';

  it('produces an argon2id hash that does not contain the password', async () => {
    const hash = await hasher.hash(password);

    expect(hash).toMatch(/^\$argon2id\$/);
    expect(hash).not.toContain(password);
  });

  it('uses a random salt, so equal passwords get different hashes', async () => {
    const [first, second] = await Promise.all([
      hasher.hash(password),
      hasher.hash(password),
    ]);

    expect(first).not.toBe(second);
  });

  it('verifies the correct password', async () => {
    const hash = await hasher.hash(password);

    await expect(hasher.verify(hash, password)).resolves.toBe(true);
  });

  it('rejects a wrong password', async () => {
    const hash = await hasher.hash(password);

    await expect(hasher.verify(hash, 'wrong-password')).resolves.toBe(false);
  });

  it('returns false instead of throwing for a malformed hash', async () => {
    await expect(hasher.verify('not-a-hash', password)).resolves.toBe(false);
  });
});
