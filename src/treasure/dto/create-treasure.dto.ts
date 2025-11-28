import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsArray,
} from 'class-validator';

export class CreateTreasureDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  // Google Maps location data
  @IsNotEmpty()
  location: {
    address: string;
    lat: number;
    lng: number;
    placeId: string;
  };

  @IsOptional()
  @IsArray()
  photos?: string[];

  @IsNumber()
  @IsNotEmpty()
  price: number;

  @IsString()
  @IsNotEmpty()
  category: string;

  @IsString()
  @IsNotEmpty()
  condition: string;

  @IsOptional()
  brand?: string;

  @IsOptional()
  itemModel?: string;

  @IsOptional()
  type?: string;

  @IsOptional()
  description?: string;
}
