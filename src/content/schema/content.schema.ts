import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class Content extends Document {
  @Prop({ required: true, unique: true })
  name: string;

  @Prop({ required: true })
  content: string;
}

export const ContentSchema = SchemaFactory.createForClass(Content);
