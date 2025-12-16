import {
  IsMongoId,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import { Transform } from 'class-transformer';

export class DeleteUserDto {
  @IsNotEmpty()
  @IsMongoId()
  @Transform(({ value }) => value.trim())
  userId: string;

  @IsOptional()
  @IsString()
  password: string;
}
