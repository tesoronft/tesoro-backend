import { Schema, Prop, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Treasure } from './treasure.schema';
import { User } from 'src/user/schema';

@Schema({ timestamps: true })
export class Report extends Document {
  @Prop({ type: Types.ObjectId, ref: 'Treasure', required: true })
  treasureId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  reportedBy: Types.ObjectId;

  @Prop({ required: true, trim: true })
  reason: string;

  @Prop({ type: String, default: '', trim: true })
  description: string;

}

export const ReportSchema = SchemaFactory.createForClass(Report);



