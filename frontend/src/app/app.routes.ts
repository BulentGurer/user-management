import { Routes } from '@angular/router';
import { adminGuard, authGuard, guestGuard } from './core/auth/auth-guards';

const APP_NAME = 'User Management';

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
  {
    path: 'users/:id',
    canActivate: [authGuard, adminGuard],
    title: `User details · ${APP_NAME}`,
    loadComponent: () =>
      import('./features/users/user-detail-page/user-detail-page').then((m) => m.UserDetailPage),
  },
  { path: '', pathMatch: 'full', redirectTo: 'users' },
  { path: '**', redirectTo: 'users' },
];
