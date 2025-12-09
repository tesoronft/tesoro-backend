import { IsMongoId, IsNotEmpty } from 'class-validator';
import { Transform } from 'class-transformer';

export class CollectTreasureDto {
  @IsNotEmpty()
  @IsMongoId()
  @Transform(({ value }) => value.trim())
  treasureId: string;

  @IsNotEmpty()
  @IsMongoId()
  @Transform(({ value }) => value.trim())
  userId: string;
}
