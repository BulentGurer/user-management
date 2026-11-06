import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Router, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { apiErrorMessage } from '../../../core/api/api-error';
import { User, UserListItem } from '../../../core/api/user-models';
import { UsersApi } from '../../../core/api/users-api';
import { AuthService } from '../../../core/auth/auth-service';
import { AppPaths } from '../../../core/routing/app-paths';
import { ConfirmationService } from '../../../shared/confirm-dialog/confirmation-service';
import { RoleBadge } from '../../../shared/role-badge/role-badge';

export const LOAD_ERROR_MESSAGE = 'Users could not be loaded. Please try again.';

/** Standard users get only ids and full names from the server, so that is all they see. */
const STANDARD_COLUMNS = ['fullName'];
const ADMIN_COLUMNS = ['username', 'fullName', 'role', 'actions'];

/**
 * The user list, open to every signed-in user. Admins also get the links to
 * create, view, edit and delete users; for others they are not rendered at
 * all. This is only for the UI: the backend rejects those requests from
 * non-admins.
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
  private readonly confirmation = inject(ConfirmationService);
  private readonly snackBar = inject(MatSnackBar);

  protected readonly paths = AppPaths;
  protected readonly loadErrorMessage = LOAD_ERROR_MESSAGE;
  protected readonly isAdmin = this.authService.isAdmin;
  protected readonly columns = computed(() => (this.isAdmin() ? ADMIN_COLUMNS : STANDARD_COLUMNS));

  /** Loads once on creation; exposes loading, error and value as signals. */
  protected readonly users = rxResource({ stream: () => this.usersApi.list() });

  protected readonly currentUserId = computed(() => this.authService.currentUser()?.id);

  /** The user being deleted right now; other deletes wait until it is done. */
  protected readonly deletingId = signal<string | null>(null);
  protected readonly deleteErrorMessage = signal<string | null>(null);

  /**
   * Admins open a user's detail page by clicking (or pressing Enter on) the
   * row. Clicks on the row's own links and buttons are left to them.
   */
  protected openDetail(user: UserListItem, event: Event): void {
    const fromControl = (event.target as Element).closest('a, button') !== null;
    if (this.isAdmin() && !fromControl) {
      void this.router.navigateByUrl(AppPaths.user(user.id));
    }
  }

  /**
   * Deletes after the admin confirms. The server has the final word: it
   * refuses to delete the last admin (409), and its message is shown as is.
   */
  protected async deleteUser(user: User): Promise<void> {
    const confirmed = await firstValueFrom(
      this.confirmation.confirm({
        title: 'Delete user?',
        message: `${user.fullName} (${user.username}) will be deleted permanently. This cannot be undone.`,
        confirmLabel: 'Delete',
        destructive: true,
      }),
    );
    if (!confirmed) {
      return;
    }

    this.deletingId.set(user.id);
    this.deleteErrorMessage.set(null);
    try {
      await firstValueFrom(this.usersApi.delete(user.id));
      this.snackBar.open(`${user.fullName} was deleted.`, undefined, { duration: 4000 });
      this.users.reload();
    } catch (error) {
      this.deleteErrorMessage.set(apiErrorMessage(error));
    } finally {
      this.deletingId.set(null);
    }
  }
}
