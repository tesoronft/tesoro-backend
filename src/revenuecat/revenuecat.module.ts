import { Module } from '@nestjs/common';
import { RevenuecatService } from './revenuecat.service';
import { RevenuecatController } from './revenuecat.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { SubscriptionSchema, Subscription } from 'src/subscription/schema';
import { ConfigModule } from '@nestjs/config';
import { User, UserSchema } from 'src/user/schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Subscription.name, schema: SubscriptionSchema },
      { name: User.name, schema: UserSchema },
    ]),
    ConfigModule,
  ],
  controllers: [RevenuecatController],
  providers: [RevenuecatService],
})
export class RevenuecatModule {}
