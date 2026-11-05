import {
  type CanActivate,
  type ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { isUUID } from 'class-validator';
import { UserResponseDto } from '../users/dto/user-response.dto.js';
import { UsersService } from '../users/users.service.js';
import type {
  AccessTokenPayload,
  AuthenticatedRequest,
} from './authenticated-request.js';
import { IS_PUBLIC_KEY } from './decorators/public.decorator.js';

const BEARER_PREFIX = 'Bearer ';

/**
 * Registered globally: every route requires a valid access token unless it
 * is marked @Public(). The token only proves who the caller is; the user,
 * including the role, is loaded from the database on every request, so a
 * deleted or demoted user loses access immediately.
 */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly jwtService: JwtService,
    private readonly usersService: UsersService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    if (this.isPublic(context)) {
      return true;
    }

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const token = this.extractBearerToken(request.headers.authorization);
    const userId = await this.verifyToken(token);

    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new UnauthorizedException();
    }

    request.user = UserResponseDto.fromEntity(user);
    return true;
  }

  private isPublic(context: ExecutionContext): boolean {
    return this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
  }

  private extractBearerToken(header: string | undefined): string {
    if (!header?.startsWith(BEARER_PREFIX)) {
      throw new UnauthorizedException();
    }
    return header.slice(BEARER_PREFIX.length).trim();
  }

  /** Checks signature, algorithm and expiry, then returns the user id. */
  private async verifyToken(token: string): Promise<string> {
    let payload: Partial<AccessTokenPayload>;
    try {
      payload = await this.jwtService.verifyAsync<AccessTokenPayload>(token);
    } catch {
      throw new UnauthorizedException();
    }

    if (typeof payload.sub !== 'string' || !isUUID(payload.sub)) {
      throw new UnauthorizedException();
    }
    return payload.sub;
  }
}
