import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { SubscriptionService } from 'src/subscription/subscription.service';

@Injectable()
export class SubscriptionGuard implements CanActivate {
  constructor(private readonly subService: SubscriptionService) {}

  async canActivate(context: ExecutionContext) {
    try {
      const req = context.switchToHttp().getRequest();
      const userId = req.user.id;

      const sub = await this.subService.getActive(userId);
      if (!sub) throw new ForbiddenException('Subscription required');

      return true;
    } catch (error) {
      console.log(error);
      throw error;
    }
  }
}
