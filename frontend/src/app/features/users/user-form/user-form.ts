import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  OnInit,
  signal,
} from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { Router, RouterLink } from '@angular/router';
import { firstValueFrom, Observable } from 'rxjs';
import { apiErrorMessage } from '../../../core/api/api-error';
import {
  FULL_NAME_MAX_LENGTH,
  FULL_NAME_MIN_LENGTH,
  PASSWORD_MAX_LENGTH,
  PASSWORD_MIN_LENGTH,
  USERNAME_MAX_LENGTH,
  USERNAME_MIN_LENGTH,
  USERNAME_PATTERN,
} from '../../../core/api/user-constraints';
import { UserDetail, UserRole } from '../../../core/api/user-models';
import { UsersApi } from '../../../core/api/users-api';
import { HOME_PATH } from '../../../core/auth/auth-guards';
import { AuthService } from '../../../core/auth/auth-service';
import { userLoadErrorMessage } from '../user-load-error';

export const ROLE_OPTIONS: readonly { value: UserRole; label: string }[] = [
  { value: UserRole.User, label: 'Standard user' },
  { value: UserRole.Admin, label: 'Admin' },
];

/**
 * One form for both creating (/users/new) and editing (/users/:id/edit) a
 * user. The route's :id decides the mode. The password is required on create;
 * on edit it is sent only when a new one is typed.
 */
@Component({
  selector: 'app-user-form',
  imports: [
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressBarModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    ReactiveFormsModule,
    RouterLink,
  ],
  templateUrl: './user-form.html',
  styleUrl: './user-form.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserForm implements OnInit {
  private readonly usersApi = inject(UsersApi);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  /** Bound from the :id route parameter; missing when creating a user. */
  readonly id = input<string>();

  protected readonly isEdit = computed(() => this.id() !== undefined);
  protected readonly roleOptions = ROLE_OPTIONS;
  protected readonly limits = {
    usernameMin: USERNAME_MIN_LENGTH,
    usernameMax: USERNAME_MAX_LENGTH,
    passwordMin: PASSWORD_MIN_LENGTH,
    passwordMax: PASSWORD_MAX_LENGTH,
    fullNameMin: FULL_NAME_MIN_LENGTH,
    fullNameMax: FULL_NAME_MAX_LENGTH,
  } as const;

  protected readonly form = inject(NonNullableFormBuilder).group({
    username: [
      '',
      [
        Validators.required,
        Validators.minLength(USERNAME_MIN_LENGTH),
        Validators.maxLength(USERNAME_MAX_LENGTH),
        Validators.pattern(USERNAME_PATTERN),
      ],
    ],
    fullName: [
      '',
      [
        Validators.required,
        Validators.minLength(FULL_NAME_MIN_LENGTH),
        Validators.maxLength(FULL_NAME_MAX_LENGTH),
      ],
    ],
    password: [
      '',
      [Validators.minLength(PASSWORD_MIN_LENGTH), Validators.maxLength(PASSWORD_MAX_LENGTH)],
    ],
    role: [UserRole.User as UserRole, Validators.required],
  });

  /** The user being edited. Idle (nothing is loaded) when creating. */
  protected readonly user = rxResource({
    params: () => this.id(),
    stream: ({ params: id }) => this.usersApi.get(id),
  });

  protected readonly loadErrorMessage = computed(() => {
    const error = this.user.error();
    return error && userLoadErrorMessage(error);
  });

  /** On create the form is ready at once; on edit, once the user is loaded. */
  protected readonly ready = computed(() => !this.isEdit() || this.user.hasValue());

  protected readonly submitting = signal(false);
  protected readonly saveErrorMessage = signal<string | null>(null);

  constructor() {
    // Fill the form with the loaded user (edit mode only).
    effect(() => {
      if (this.user.hasValue()) {
        const { username, fullName, role } = this.user.value();
        this.form.patchValue({ username, fullName, role });
      }
    });
  }

  ngOnInit(): void {
    // Inputs are set by now, so the mode is known.
    if (!this.isEdit()) {
      this.form.controls.password.addValidators(Validators.required);
      this.form.controls.password.updateValueAndValidity();
    }
  }

  /** Where Cancel goes: back to the user on edit, to the list on create. */
  protected cancelLink(): string[] {
    const id = this.id();
    return id === undefined ? [HOME_PATH] : [HOME_PATH, id];
  }

  protected async submit(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.submitting.set(true);
    this.saveErrorMessage.set(null);
    try {
      const saved = await firstValueFrom(this.save());
      await this.leaveAfterSave(saved);
    } catch (error) {
      this.saveErrorMessage.set(apiErrorMessage(error));
    } finally {
      this.submitting.set(false);
    }
  }

  private save(): Observable<UserDetail> {
    const { username, fullName, password, role } = this.form.getRawValue();
    const id = this.id();
    if (id === undefined) {
      return this.usersApi.create({ username, fullName, password, role });
    }
    // An empty password field keeps the current password.
    return this.usersApi.update(id, {
      username,
      fullName,
      role,
      ...(password ? { password } : {}),
    });
  }

  /**
   * Shows the saved user. If admins edit themselves, their name or role in the
   * header may be stale, so it is reloaded; admins who removed their own admin
   * role can no longer open admin pages and go back to the list.
   */
  private async leaveAfterSave(saved: UserDetail): Promise<void> {
    if (saved.id === this.authService.currentUser()?.id) {
      await this.authService.refreshCurrentUser();
      if (!this.authService.isAdmin()) {
        await this.router.navigateByUrl(HOME_PATH);
        return;
      }
    }
    await this.router.navigate([HOME_PATH, saved.id]);
  }
}
