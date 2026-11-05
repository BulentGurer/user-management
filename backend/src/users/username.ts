/**
 * Usernames are case-insensitive: they are stored and looked up in lowercase,
 * so "Admin" and "admin" are the same account.
 */
export function normalizeUsername(username: string): string {
  return username.trim().toLowerCase();
}
