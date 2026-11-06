/** Mirrors the backend DTOs (see the API docs at /api/docs). */

export const UserRole = {
  Admin: 'admin',
  User: 'user',
} as const;
export type UserRole = (typeof UserRole)[keyof typeof UserRole];

/** What a standard user sees of each user in the list. */
export interface UserSummary {
  id: string;
  fullName: string;
}

/** A user as admins see it in the list, and as /auth/me returns the signed-in user. */
export interface User extends UserSummary {
  username: string;
  role: UserRole;
}

/** One list row. The server decides by role: full rows for admins, summaries for others. */
export type UserListItem = User | UserSummary;

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
