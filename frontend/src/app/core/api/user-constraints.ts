/**
 * The backend's rules for user fields (backend/src/users/user.constraints.ts),
 * repeated here only to give instant feedback in forms. The server validates
 * every request again, and its answer always wins.
 */
export const USERNAME_MIN_LENGTH = 3;
export const USERNAME_MAX_LENGTH = 32;
/**
 * Letters, digits, dot, underscore and hyphen. Upper case is allowed because
 * the server stores usernames in lower case anyway.
 */
export const USERNAME_PATTERN = /^[a-z0-9._-]+$/i;

export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 128;

export const FULL_NAME_MIN_LENGTH = 2;
export const FULL_NAME_MAX_LENGTH = 100;
