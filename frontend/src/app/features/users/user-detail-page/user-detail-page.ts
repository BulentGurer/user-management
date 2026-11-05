import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { RouterLink } from '@angular/router';
import { UsersApi } from '../../../core/api/users-api';
import { RoleBadge } from '../../../shared/role-badge/role-badge';
import { userLoadErrorMessage } from '../user-load-error';

/** One user's details, including when they were created and last updated (admin only). */
@Component({
  selector: 'app-user-detail-page',
  imports: [DatePipe, MatButtonModule, MatIconModule, MatProgressBarModule, RoleBadge, RouterLink],
  templateUrl: './user-detail-page.html',
  styleUrl: './user-detail-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserDetailPage {
  private readonly usersApi = inject(UsersApi);

  /** Bound from the :id route parameter (withComponentInputBinding). */
  readonly id = input.required<string>();

  /** Loads again whenever the id changes. */
  protected readonly user = rxResource({
    params: () => this.id(),
    stream: ({ params: id }) => this.usersApi.get(id),
  });

  protected readonly errorMessage = computed(() => {
    const error = this.user.error();
    return error && userLoadErrorMessage(error);
  });
}
