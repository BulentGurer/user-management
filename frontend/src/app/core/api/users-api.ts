import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiPaths } from './api-paths';
import { User } from './user-models';

/** HTTP client for the /api/users endpoints. Components never build API URLs themselves. */
@Injectable({ providedIn: 'root' })
export class UsersApi {
  private readonly http = inject(HttpClient);

  /** All users, ordered by username (the server decides the order). */
  list(): Observable<User[]> {
    return this.http.get<User[]>(ApiPaths.users);
  }
}
