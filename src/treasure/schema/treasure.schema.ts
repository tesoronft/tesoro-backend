import { Schema, Prop, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Category } from 'src/category/schema';
import { User } from 'src/user/schema';

export class Location {
  @Prop({ type: String, enum: ['Point'], default: 'Point' })
  type: 'Point';

  @Prop({ type: [Number], required: true }) // [lng, lat]
  coordinates: [number, number];

  @Prop({ type: String, default: '' })
  address: string;

  @Prop({ type: String, default: '' })
  placeId: string;
}

@Schema({ timestamps: true })
export class Treasure extends Document {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  postedBy: User;

  @Prop({ type: Types.ObjectId, ref: 'Category', required: true })
  category: Category;

  @Prop({ required: true, trim: true })
  title: string;

  @Prop({ type: Location, required: true })
  location: Location;

  @Prop({ type: [String], default: [] })
  photos: string[];

  @Prop({ required: true })
  price: number;

  @Prop({ required: true, trim: true })
  condition: string;

  @Prop({ type: String, default: '', trim: true })
  brand: string;

  @Prop({ type: String, default: '', trim: true })
  itemModel: string;

  @Prop({ type: String, default: '', trim: true })
  type: string;

  @Prop({ type: String, default: '', trim: true })
  description: string;

  @Prop({ type: Types.ObjectId, ref: 'User', default: null })
  collectedBy: Types.ObjectId | null;

  @Prop({ type: Date, default: null })
  collectedAt: Date | null;
}

export const TreasureSchema = SchemaFactory.createForClass(Treasure);

TreasureSchema.index({ location: '2dsphere' });
