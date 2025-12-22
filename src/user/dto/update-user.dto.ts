import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsMongoId,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
export class UpdateUserDto {
  @IsNotEmpty()
  @IsMongoId()
  @Transform(({ value }) => value.trim())
  userId: string;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => value.trim())
  name: string;

  @IsOptional()
  @IsString()
  profileImage?: string;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => value.trim())
  currentPassword;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => value.trim())
  newPassword;

  @IsOptional()
  @IsBoolean()
  isBlocked: boolean;

  @IsOptional()
  @IsBoolean()
  isDeleted: boolean;
}
