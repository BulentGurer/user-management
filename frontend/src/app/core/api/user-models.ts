/** Mirrors the backend DTOs (see the API docs at /api/docs). */

export const UserRole = {
  Admin: 'admin',
  User: 'user',
} as const;
export type UserRole = (typeof UserRole)[keyof typeof UserRole];

/** A user as listed for every signed-in user. */
export interface User {
  id: string;
  username: string;
  fullName: string;
  role: UserRole;
}

/** The admin-only detail view. Dates are ISO 8601 strings. */
export interface UserDetail extends User {
  createdAt: string;
  updatedAt: string;
}

export interface CreateUserRequest {
  username: string;
  password: string;
  fullName: string;
  role: UserRole;
}

/** Only the given fields change; a password is sent only to set a new one. */
export type UpdateUserRequest = Partial<CreateUserRequest>;

export interface LoginResponse {
  accessToken: string;
  tokenType: 'Bearer';
  /** Lifetime of the access token in seconds. */
  expiresIn: number;
}
