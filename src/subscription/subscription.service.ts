import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { SubscriptionDocument, Subscription } from './schema';

@Injectable()
export class SubscriptionService {
  constructor(
    @InjectModel(Subscription.name)
    private model: Model<SubscriptionDocument>,
  ) {}

  async getActive(userId: any) {
    try {
      return this.model.findOne({
        user: userId,
        status: 'active',
        endDate: { $gt: new Date() },
      });
    } catch (error) {
      console.log(error);
      throw error;
    }
  }
}
