import { Schema, Prop, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { User } from 'src/user/schema';
import { Treasure } from 'src/treasure/schema/treasure.schema';

@Schema({ timestamps: true })
export class Tip extends Document {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  givenUser: User;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  receivedUser: User;

  @Prop({ type: Types.ObjectId, ref: 'Treasure', required: true })
  treasure: Treasure;

  @Prop({ required: true })
  amount: number;
}

export const TipSchema = SchemaFactory.createForClass(Tip);
