/**
 * Hashes and verifies passwords. Consumers depend on this abstraction, not on
 * a specific algorithm, so the algorithm can change in one place.
 *
 * An abstract class (not an interface) is used because it also serves as the
 * dependency injection token: TypeScript interfaces do not exist at runtime.
 */
export abstract class PasswordHasher {
  abstract hash(plainPassword: string): Promise<string>;

  /** Returns false (never throws) when the password does not match. */
  abstract verify(
    passwordHash: string,
    plainPassword: string,
  ): Promise<boolean>;
}
