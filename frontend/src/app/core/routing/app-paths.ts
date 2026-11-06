/**
 * Links to the app's pages, so that no component builds a URL by hand (the
 * same idea as ApiPaths for the backend). The route patterns themselves are
 * defined in app.routes.ts.
 */
export const AppPaths = {
  login: '/login',
  users: '/users',
  newUser: '/users/new',
  user: (id: string) => `/users/${encodeURIComponent(id)}`,
  editUser: (id: string) => `/users/${encodeURIComponent(id)}/edit`,
} as const;

/** Where signed-in users land, and where non-admins are sent back to. */
export const HOME_PATH = AppPaths.users;
