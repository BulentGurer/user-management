import { HttpErrorResponse, HttpStatusCode } from '@angular/common/http';
import { apiErrorMessage } from '../../core/api/api-error';

export const USER_NOT_FOUND_MESSAGE = 'User not found. They may have been deleted.';

/**
 * The message for a user that could not be loaded. A malformed id (400) and
 * an unknown id (404) both mean there is no such user.
 */
export function userLoadErrorMessage(error: unknown): string {
  const noSuchUser =
    error instanceof HttpErrorResponse &&
    (error.status === HttpStatusCode.NotFound || error.status === HttpStatusCode.BadRequest);
  return noSuchUser ? USER_NOT_FOUND_MESSAGE : apiErrorMessage(error);
}
