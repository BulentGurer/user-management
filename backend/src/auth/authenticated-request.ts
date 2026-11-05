import type { Request } from 'express';
import type { UserResponseDto } from '../users/dto/user-response.dto.js';

/**
 * The user attached to a request by JwtAuthGuard. It is loaded from the
 * database on every request and never contains the password hash.
 */
export type AuthenticatedUser = UserResponseDto;

export interface AuthenticatedRequest extends Request {
  user?: AuthenticatedUser;
}

/** The claims inside an access token: only the user id (`sub`). */
export interface AccessTokenPayload {
  sub: string;
}
