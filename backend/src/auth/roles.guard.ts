// backend/src/auth/roles.guard.ts
import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from './roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(ctx: ExecutionContext): boolean {
    const requiredRoles = this.reflector.get<string[]>(
      ROLES_KEY,
      ctx.getHandler(),
    );
    if (!requiredRoles || requiredRoles.length === 0) {
      return true; // no roles required
    }

    const req = ctx.switchToHttp().getRequest();
    const user = req.user;
    // In dev mode, you can force-enable admin:
    if (process.env.NODE_ENV !== 'production') {
      return true;
    }

    // assume user.roles is a string[] on the JWT payload
    const userRoles: string[] = user.roles || [];
    return requiredRoles.some((role) => userRoles.includes(role));
  }
}
