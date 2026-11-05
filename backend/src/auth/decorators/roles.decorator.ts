import { SetMetadata } from '@nestjs/common';
import type { UserRole } from '../../users/user-role.enum.js';

export const ROLES_KEY = 'roles';

/**
 * Restricts a route (or every route of a controller) to the given roles.
 * Routes without it are open to every authenticated user.
 */
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);
