import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class RevenueCatWebhookGuard implements CanActivate {
  constructor(private configService: ConfigService) {}
  canActivate(context: ExecutionContext): boolean {
    try {
      const req = context.switchToHttp().getRequest();
      const auth = req.headers['authorization'];

      if (
        auth !== this.configService.get<string>('REVENUECAT_WEBHOOK_SECRET')
      ) {
        throw new UnauthorizedException('Invalid RevenueCat webhook');
      }
      return true;
    } catch (error) {
      console.log(error);
      throw error;
    }
  }
}
