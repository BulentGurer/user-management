import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';

/**
 * Opts a route out of the global JwtAuthGuard. Every route requires a valid
 * token unless it is marked with this decorator (deny by default).
 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
