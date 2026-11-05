import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { UserRole } from '../../core/api/user-models';

/** A small label for a user's role. Only the admin badge uses the accent colour. */
@Component({
  selector: 'app-role-badge',
  template: '{{ role() }}',
  styleUrl: './role-badge.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '[class.admin]': 'isAdmin()' },
})
export class RoleBadge {
  readonly role = input.required<UserRole>();

  protected readonly isAdmin = computed(() => this.role() === UserRole.Admin);
}
