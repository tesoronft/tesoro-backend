import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { RevenuecatService } from './revenuecat.service';
import { RevenueCatWebhookGuard } from 'src/common/guards';

@Controller('revenuecat')
export class RevenuecatController {
  constructor(private readonly revenuecatService: RevenuecatService) {}

  @Post('webhooks')
  @UseGuards(RevenueCatWebhookGuard)
  async handleWebhook(@Body() body: any) {
    await this.revenuecatService.processEvent(body.event);
    return { received: true };
  }
}
