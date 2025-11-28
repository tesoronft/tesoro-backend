import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from 'src/common/decorators';
import { ROLE } from '../constants';
import { GuardMessages } from '../messages';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<ROLE[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles) return true;

    const { user } = context.switchToHttp().getRequest();

    if (!user) {
      throw new ForbiddenException(GuardMessages.USER_NOT_FOUND);
    }

    if (!requiredRoles.includes(user.role)) {
      throw new ForbiddenException(GuardMessages.DONT_HAVE_PERMISSION);
    }

    return true;
  }
}
