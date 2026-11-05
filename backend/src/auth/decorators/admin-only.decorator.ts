import { applyDecorators } from '@nestjs/common';
import { ApiForbiddenResponse } from '@nestjs/swagger';
import { UserRole } from '../../users/user-role.enum.js';
import { Roles } from './roles.decorator.js';

/** Restricts a route to admins and documents the 403 response. */
export const AdminOnly = () =>
  applyDecorators(
    Roles(UserRole.Admin),
    ApiForbiddenResponse({ description: 'The caller is not an admin' }),
  );
