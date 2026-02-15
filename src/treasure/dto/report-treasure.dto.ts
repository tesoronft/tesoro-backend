import { IsNotEmpty, IsString, IsMongoId, IsOptional, MaxLength } from 'class-validator';

export class ReportTreasureDto {
  @IsNotEmpty()
  @IsMongoId()
  treasureId: string;

  @IsNotEmpty()
  @IsString()
  @MaxLength(100)
  reason: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;
}


