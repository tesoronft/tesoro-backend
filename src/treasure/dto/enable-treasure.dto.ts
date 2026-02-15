import { IsNotEmpty, IsMongoId, IsBoolean } from 'class-validator';

export class EnableTreasureDto {
  @IsNotEmpty()
  @IsMongoId()
  treasureId: string;

  @IsNotEmpty()
  @IsBoolean()
  isDisable: boolean;
}


