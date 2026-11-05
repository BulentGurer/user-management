import { HttpErrorResponse } from '@angular/common/http';

export const SERVER_UNREACHABLE_MESSAGE = 'The server could not be reached. Please try again.';
export const UNEXPECTED_ERROR_MESSAGE = 'Something went wrong. Please try again.';

/** The error body NestJS sends. Validation errors carry one message per failed rule. */
interface ApiErrorBody {
  message?: string | string[];
}

/**
 * A message to show for a failed API call. The server's own message is used
 * for client errors (4xx), where it explains what to fix, e.g. "Username is
 * already taken". Server errors get a generic message instead.
 */
export function apiErrorMessage(error: unknown): string {
  if (!(error instanceof HttpErrorResponse)) {
    return UNEXPECTED_ERROR_MESSAGE;
  }
  if (error.status === 0) {
    return SERVER_UNREACHABLE_MESSAGE;
  }
  const isClientError = error.status >= 400 && error.status < 500;
  const messages = [(error.error as ApiErrorBody | null)?.message ?? []]
    .flat()
    .filter((message) => typeof message === 'string' && message.length > 0);
  return isClientError && messages.length > 0
    ? messages.map(asSentence).join(' ')
    : UNEXPECTED_ERROR_MESSAGE;
}

function asSentence(message: string): string {
  const sentence = message.charAt(0).toUpperCase() + message.slice(1);
  return /[.!?]$/.test(sentence) ? sentence : `${sentence}.`;
}
