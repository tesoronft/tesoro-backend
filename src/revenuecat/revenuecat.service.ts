import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { SubscriptionDocument, Subscription } from 'src/subscription/schema';
import { RevenueCatEventInnerDto } from './dto';
import { User } from 'src/user/schema';

@Injectable()
export class RevenuecatService {
  constructor(
    @InjectModel(Subscription.name)
    private subModel: Model<SubscriptionDocument>,
    @InjectModel(User.name)
    private readonly userModel: Model<User>,
  ) {}

  async processEvent(event: RevenueCatEventInnerDto) {
    try {
      const exists = await this.subModel.findOne({
        eventId: event.id,
      });

      if (exists) return; // idempotent

      switch (event.type) {
        case 'INITIAL_PURCHASE':
        case 'RENEWAL':
        case 'PRODUCT_CHANGE':
          await this.activate(event);
          break;

        case 'EXPIRATION':
        case 'CANCELLATION':
          await this.expire(event);
          break;
      }
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  private async activate(event: any) {
    try {
      const userId = new Types.ObjectId(event.app_user_id);

      await Promise.all([
        this.subModel.findOneAndUpdate(
          { user: userId },
          {
            user: userId,
            productId: event.product_id,
            status: 'active',
            startDate: new Date(event.purchased_at_ms),
            endDate: new Date(event.expiration_at_ms),
            transactionId: event.transaction_id,
            eventId: event.id,
          },
          { upsert: true },
        ),

        // ✅ Mark user as premium
        this.userModel.updateOne(
          { _id: userId },
          { $set: { isPremium: true } },
        ),
      ]);
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  private async expire(event: any) {
    try {
      const userId = new Types.ObjectId(event.app_user_id);

      await Promise.all([
        // ✅ Expire subscription
        this.subModel.updateOne(
          { user: userId },
          {
            $set: {
              status: 'expired',
              eventId: event.id,
            },
          },
        ),

        // ✅ Remove premium
        this.userModel.updateOne(
          { _id: userId },
          { $set: { isPremium: false } },
        ),
      ]);
    } catch (error) {
      console.log(error);
      throw error;
    }
  }
}
