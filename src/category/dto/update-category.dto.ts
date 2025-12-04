import { Transform } from 'class-transformer';
import {
  IsString,
  IsOptional,
  IsMongoId,
  IsNotEmpty,
} from 'class-validator';

export class UpdateCategoryDto {
  @IsNotEmpty()
  @IsMongoId()
  @IsString()
  @Transform(({ value }) => value.trim())
  categoryId: string;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => value.trim())
  name: string;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => value.trim())
  description?: string;
}
