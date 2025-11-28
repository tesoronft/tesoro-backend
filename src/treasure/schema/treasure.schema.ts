import { Schema, Prop, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class Treasure extends Document {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ required: true })
  title: string;

  @Prop({
    type: {
      address: { type: String, default: '' },
      lat: { type: Number, default: null },
      lng: { type: Number, default: null },
      placeId: { type: String, default: '' },
    },
    required: true,
  })
  location: {
    address: string;
    lat: number;
    lng: number;
    placeId: string;
  };

  @Prop({ type: [String], default: [] })
  photos: string[];

  @Prop({ required: true })
  price: number;

  @Prop({ required: true })
  category: string;

  @Prop({ required: true })
  condition: string;

  @Prop({ type: String, default: '' })
  brand: string;

  @Prop({ type: String, default: '' })
  itemModel: string;

  @Prop({ type: String, default: '' })
  type: string;

  @Prop({ type: String, default: '' })
  description: string;
}

export const TreasureSchema = SchemaFactory.createForClass(Treasure);
