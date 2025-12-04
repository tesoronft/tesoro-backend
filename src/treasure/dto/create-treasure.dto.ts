import { Transform } from 'class-transformer';
import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsArray,
  IsMongoId,
} from 'class-validator';

class LocationDto {
  @IsNotEmpty()
  @IsString()
  address: string;

  @IsNotEmpty()
  @IsNumber()
  lat: number;

  @IsNotEmpty()
  @IsNumber()
  lng: number;

  @IsOptional()
  @IsString()
  placeId?: string;
}

export class CreateTreasureDto {
  @IsNotEmpty()
  @IsString()
  @Transform(({ value }) => value.trim())
  title: string;

  @IsNotEmpty()
  location: LocationDto;

  @IsOptional()
  @IsArray()
  photos?: string[];

  @IsNumber()
  price: number;

  @IsNotEmpty()
  @IsMongoId()
  category: string;

  @IsNotEmpty()
  @IsString()
  @Transform(({ value }) => value.trim())
  condition: string;

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
