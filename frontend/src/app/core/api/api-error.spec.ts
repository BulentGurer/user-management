import { HttpErrorResponse } from '@angular/common/http';
import { apiErrorMessage, SERVER_UNREACHABLE_MESSAGE, UNEXPECTED_ERROR_MESSAGE } from './api-error';

function httpError(status: number, error: unknown = null): HttpErrorResponse {
  return new HttpErrorResponse({ status, error });
}

describe('apiErrorMessage', () => {
  it("shows the server's message for a conflict", () => {
    const error = httpError(409, { statusCode: 409, message: 'Username is already taken' });

    expect(apiErrorMessage(error)).toBe('Username is already taken.');
  });

  it('joins validation messages into sentences', () => {
    const error = httpError(400, {
      message: ['username must be longer than or equal to 3 characters', 'role is invalid'],
    });

    expect(apiErrorMessage(error)).toBe(
      'Username must be longer than or equal to 3 characters. Role is invalid.',
    );
  });

  it('says so when the server cannot be reached', () => {
    expect(apiErrorMessage(httpError(0))).toBe(SERVER_UNREACHABLE_MESSAGE);
  });

  it.each([
    ['a server error', httpError(500, { message: 'Internal server error' })],
    ['a client error without a message', httpError(404, null)],
    ['an error that is not from HTTP', new Error('boom')],
  ])('falls back to a generic message for %s', (_case, error) => {
    expect(apiErrorMessage(error)).toBe(UNEXPECTED_ERROR_MESSAGE);
  });
});
