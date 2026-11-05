import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTableModule } from '@angular/material/table';
import { UsersApi } from '../../../core/api/users-api';
import { AuthService } from '../../../core/auth/auth-service';
import { RoleBadge } from '../../../shared/role-badge/role-badge';

export const LOAD_ERROR_MESSAGE = 'Users could not be loaded. Please try again.';

/** The user list, open to every signed-in user. */
@Component({
  selector: 'app-user-list',
  imports: [MatButtonModule, MatProgressBarModule, MatTableModule, RoleBadge],
  templateUrl: './user-list.html',
  styleUrl: './user-list.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserList {
  private readonly usersApi = inject(UsersApi);
  private readonly authService = inject(AuthService);

  protected readonly loadErrorMessage = LOAD_ERROR_MESSAGE;
  protected readonly columns = ['username', 'fullName', 'role'];

  /** Loads once on creation; exposes loading, error and value as signals. */
  protected readonly users = rxResource({ stream: () => this.usersApi.list() });

  protected readonly currentUserId = computed(() => this.authService.currentUser()?.id);
}
