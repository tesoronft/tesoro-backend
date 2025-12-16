import { Transform } from 'class-transformer';
import { IsMongoId, IsNotEmpty, IsOptional, IsString } from 'class-validator';
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
}
