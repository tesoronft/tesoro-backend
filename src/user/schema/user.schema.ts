import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { ROLE } from 'src/common/constants';

@Schema({ timestamps: true })
export class User extends Document {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: false, default: null })
  password: string;

  @Prop({ enum: ROLE, type: String, default: ROLE.USER })
  role: ROLE;

  @Prop({ default: false })
  isDeleted: boolean;

  @Prop({ default: false })
  isBlocked: boolean;

  @Prop({ type: String, default: null })
  otp: string | null;

  @Prop({ type: Date, default: null })
  otpExpiry: Date | null;

  @Prop({ type: Number, default: 0 })
  otpAttempts: number;

  @Prop({ default: false })
  isOtpVerified: boolean;

  @Prop({ default: null })
  passwordResetAt: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);
