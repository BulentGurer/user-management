/**
 * Rules for user fields, shared by the entity, request validation and seed
 * data so that every layer enforces the same limits.
 */
export const USERNAME_MIN_LENGTH = 3;
export const USERNAME_MAX_LENGTH = 32;
/** Lowercase letters, digits, dot, underscore and hyphen. */
export const USERNAME_PATTERN = /^[a-z0-9._-]+$/;

export const PASSWORD_MIN_LENGTH = 8;
/**
 * Hashing cost grows with input length, so an unbounded password would let a
 * single request keep the CPU busy (denial of service).
 */
export const PASSWORD_MAX_LENGTH = 128;

export const FULL_NAME_MIN_LENGTH = 2;
export const FULL_NAME_MAX_LENGTH = 100;
