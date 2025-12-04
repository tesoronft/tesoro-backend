import {
  IsOptional,
  IsEnum,
  IsNumber,
  IsString,
  IsPositive,
  Min,
  Max,
  IsMongoId,
  IsNotEmpty,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { TreasureScope } from 'src/common/constants';

export class GetTreasureDto {
  @IsMongoId()
  @IsNotEmpty()
  @Transform(({ value }) => value.trim())
  treasureId: string;
}

export class GetTreasuresQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsPositive()
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsPositive()
  limit?: number;

  @IsOptional()
  @IsString()
  searchBy?: string;

  @IsOptional()
  @IsMongoId()
  category?: string;

  @IsOptional()
  @IsString()
  condition?: string;

  // Geolocation
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @IsPositive()
  distance?: number; 

  @IsOptional()
  @IsEnum(TreasureScope, {
    message: 'scope must be either "mine" or "all"',
  })
  scope?: TreasureScope;
}
