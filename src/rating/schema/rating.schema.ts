import { Schema, Prop, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { User } from 'src/user/schema';
import { Treasure } from 'src/treasure/schema/treasure.schema';

@Schema({ timestamps: true })
export class Rating extends Document {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  user: User;

  @Prop({ type: Types.ObjectId, ref: 'Treasure', required: true })
  treasure: Treasure;

  @Prop({
    type: Number,
    enum: [1, 2, 3, 4, 5],
    required: true,
  })
  rate: number;
}

export const RatingSchema = SchemaFactory.createForClass(Rating);
