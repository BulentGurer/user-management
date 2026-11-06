import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiPaths } from './api-paths';
import { CreateUserRequest, UpdateUserRequest, UserDetail, UserListItem } from './user-models';

/** HTTP client for the /api/users endpoints. Components never build API URLs themselves. */
@Injectable({ providedIn: 'root' })
export class UsersApi {
  private readonly http = inject(HttpClient);

  /** All users, ordered by username. Only admins get usernames and roles (see UserListItem). */
  list(): Observable<UserListItem[]> {
    return this.http.get<UserListItem[]>(ApiPaths.users);
  }

  /** One user, with timestamps (admin only). */
  get(id: string): Observable<UserDetail> {
    return this.http.get<UserDetail>(ApiPaths.user(id));
  }

  create(request: CreateUserRequest): Observable<UserDetail> {
    return this.http.post<UserDetail>(ApiPaths.users, request);
  }

  update(id: string, request: UpdateUserRequest): Observable<UserDetail> {
    return this.http.patch<UserDetail>(ApiPaths.user(id), request);
  }
}
