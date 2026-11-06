import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Router, RouterLink } from '@angular/router';
import { UserListItem } from '../../../core/api/user-models';
import { UsersApi } from '../../../core/api/users-api';
import { AuthService } from '../../../core/auth/auth-service';
import { RoleBadge } from '../../../shared/role-badge/role-badge';

export const LOAD_ERROR_MESSAGE = 'Users could not be loaded. Please try again.';

/** Standard users get only ids and full names from the server, so that is all they see. */
const STANDARD_COLUMNS = ['fullName'];
const ADMIN_COLUMNS = ['username', 'fullName', 'role', 'actions'];

/**
 * The user list, open to every signed-in user. Admins also get the links to
 * create, view and edit users; for others they are not rendered at all. This
 * is only for the UI: the backend rejects those requests from non-admins.
 */
@Component({
  selector: 'app-user-list',
  imports: [
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule,
    MatTableModule,
    MatTooltipModule,
    RoleBadge,
    RouterLink,
  ],
  templateUrl: './user-list.html',
  styleUrl: './user-list.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserList {
  private readonly usersApi = inject(UsersApi);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly loadErrorMessage = LOAD_ERROR_MESSAGE;
  protected readonly isAdmin = this.authService.isAdmin;
  protected readonly columns = computed(() => (this.isAdmin() ? ADMIN_COLUMNS : STANDARD_COLUMNS));

  /** Loads once on creation; exposes loading, error and value as signals. */
  protected readonly users = rxResource({ stream: () => this.usersApi.list() });

  protected readonly currentUserId = computed(() => this.authService.currentUser()?.id);

  /**
   * Admins open a user's detail page by clicking (or pressing Enter on) the
   * row. Clicks on the row's own links and buttons are left to them.
   */
  protected openDetail(user: UserListItem, event: Event): void {
    const fromControl = (event.target as Element).closest('a, button') !== null;
    if (this.isAdmin() && !fromControl) {
      void this.router.navigate(['/users', user.id]);
    }
  }
}
