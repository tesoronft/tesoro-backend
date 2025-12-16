import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { User } from 'src/user/schema';

export type SubscriptionDocument = Subscription & Document;

@Schema({ timestamps: true })
export class Subscription {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  user: Types.ObjectId; // RevenueCat app_user_id

  @Prop({ required: true })
  productId: string;

  @Prop({ required: true })
  status: 'active' | 'expired' | 'cancelled';

  @Prop({ required: true })
  startDate: Date;

  @Prop({ required: true })
  endDate: Date;

  @Prop()
  transactionId: string;

  @Prop({ default: 'revenuecat' })
  provider: string;

  @Prop({ unique: true })
  eventId: string; // For idempotency
}

export const SubscriptionSchema = SchemaFactory.createForClass(Subscription);
