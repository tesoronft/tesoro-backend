import {
  IsOptional,
  IsString,
  IsNumber,
  IsArray,
  ValidateNested,
  IsMongoId,
  IsNotEmpty,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';

class LocationDto {
  @IsOptional()
  @IsString()
  @Transform(({ value }) => value.trim())
  address?: string;

  @IsNumber()
  lat?: number;

  @IsNumber()
  lng?: number;

  @IsOptional()
  @IsString()
  placeId?: string;
}

export class UpdateTreasureDto {
  @IsNotEmpty()
  @IsMongoId()
  @Transform(({ value }) => value.trim())
  treasureId: string; // required

  @IsOptional()
  @IsString()
  @Transform(({ value }) => value.trim())
  title?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => LocationDto)
  location?: LocationDto;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  photos?: string[];

  @IsOptional()
  @IsNumber()
  price?: number;

  @IsOptional()
  @IsMongoId()
  category?: string;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => value.trim())
  condition?: string;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => value.trim())
  brand?: string;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => value.trim())
  itemModel?: string;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => value.trim())
  type?: string;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => value.trim())
  description?: string;
}
