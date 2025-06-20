// backend/src/auth/roles.decorator.ts
import { SetMetadata } from '@nestjs/common';

/**
 * @param roles one or more roles, e.g. 'admin', 'moderator'
 */
export const ROLES_KEY = 'roles';
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);
/**
 * Usage:
 * @Roles('admin', 'moderator')
 * @Controller('admin/some-route')
 * class SomeController {}
 *
 * This decorator sets metadata that can be used by guards to check if the user has the required roles.
 */
