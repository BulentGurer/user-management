import { Routes } from '@angular/router';
import { adminGuard, authGuard, guestGuard } from './core/auth/auth-guards';

const APP_NAME = 'User Management';

// Route patterns. Links to these pages come from AppPaths (core/routing).

export const routes: Routes = [
  {
    path: 'login',
    canActivate: [guestGuard],
    title: `Sign in · ${APP_NAME}`,
    loadComponent: () => import('./features/auth/login/login').then((m) => m.Login),
  },
  {
    path: 'users',
    canActivate: [authGuard],
    title: `Users · ${APP_NAME}`,
    loadComponent: () => import('./features/users/user-list/user-list').then((m) => m.UserList),
  },
  // Before 'users/:id', so that "new" is not taken for an id.
  {
    path: 'users/new',
    canActivate: [authGuard, adminGuard],
    title: `New user · ${APP_NAME}`,
    loadComponent: () => import('./features/users/user-form/user-form').then((m) => m.UserForm),
  },
  {
    path: 'users/:id',
    canActivate: [authGuard, adminGuard],
    title: `User details · ${APP_NAME}`,
    loadComponent: () =>
      import('./features/users/user-detail-page/user-detail-page').then((m) => m.UserDetailPage),
  },
  {
    path: 'users/:id/edit',
    canActivate: [authGuard, adminGuard],
    title: `Edit user · ${APP_NAME}`,
    loadComponent: () => import('./features/users/user-form/user-form').then((m) => m.UserForm),
  },
  { path: '', pathMatch: 'full', redirectTo: 'users' },
  { path: '**', redirectTo: 'users' },
];
