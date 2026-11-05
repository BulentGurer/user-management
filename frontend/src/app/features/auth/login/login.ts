import { HttpErrorResponse, HttpStatusCode } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, inject, input, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Router } from '@angular/router';
import { PASSWORD_MAX_LENGTH, USERNAME_MAX_LENGTH } from '../../../core/api/user-constraints';
import { HOME_PATH } from '../../../core/auth/auth-guards';
import { AuthService } from '../../../core/auth/auth-service';

// Only the upper limits are checked on login; the other rules are not
// repeated here, so the login form reveals nothing about them.

export const INVALID_CREDENTIALS_MESSAGE = 'Invalid username or password.';
export const SERVER_UNREACHABLE_MESSAGE = 'Could not sign in. Please try again in a moment.';

@Component({
  selector: 'app-login',
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './login.html',
  styleUrl: './login.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Login {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  /** Bound from the ?returnUrl= query parameter (withComponentInputBinding). */
  readonly returnUrl = input<string>();

  protected readonly form = inject(NonNullableFormBuilder).group({
    username: ['', [Validators.required, Validators.maxLength(USERNAME_MAX_LENGTH)]],
    password: ['', [Validators.required, Validators.maxLength(PASSWORD_MAX_LENGTH)]],
  });

  protected readonly submitting = signal(false);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly passwordVisible = signal(false);

  protected async submit(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.submitting.set(true);
    this.errorMessage.set(null);
    try {
      const { username, password } = this.form.getRawValue();
      await this.authService.login(username, password);
      await this.router.navigateByUrl(this.safeReturnUrl());
    } catch (error) {
      this.errorMessage.set(messageFor(error));
    } finally {
      this.submitting.set(false);
    }
  }

  protected togglePasswordVisibility(): void {
    this.passwordVisible.update((visible) => !visible);
  }

  /**
   * Only paths inside this app are accepted, so a crafted link cannot send
   * the user elsewhere after signing in (open redirect).
   */
  private safeReturnUrl(): string {
    const url = this.returnUrl();
    return url && url.startsWith('/') && !url.startsWith('//') ? url : HOME_PATH;
  }
}

function messageFor(error: unknown): string {
  const wrongCredentials =
    error instanceof HttpErrorResponse &&
    (error.status === HttpStatusCode.Unauthorized || error.status === HttpStatusCode.BadRequest);
  return wrongCredentials ? INVALID_CREDENTIALS_MESSAGE : SERVER_UNREACHABLE_MESSAGE;
}
