/**
 * Relative URLs: the browser always talks to its own origin. In development
 * the Angular dev server proxies /api to the backend, in containers nginx
 * does, so no CORS configuration is needed anywhere.
 */
export const API_ROOT = '/api';

export const ApiPaths = {
  login: `${API_ROOT}/auth/login`,
  me: `${API_ROOT}/auth/me`,
  users: `${API_ROOT}/users`,
  user: (id: string) => `${API_ROOT}/users/${encodeURIComponent(id)}`,
} as const;

export function isApiRequest(url: string): boolean {
  return url === API_ROOT || url.startsWith(`${API_ROOT}/`);
}
