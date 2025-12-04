import { Transform } from 'class-transformer';
import { IsMongoId, IsNotEmpty } from 'class-validator';

export class DeleteTreasureDto {
  @IsMongoId()
  @IsNotEmpty()
  @Transform(({ value }) => value.trim())
  treasureId: string;
}
