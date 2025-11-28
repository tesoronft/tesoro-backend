import { IsMongoId, IsNotEmpty } from 'class-validator';

export class DeleteTreasureDto {
  @IsMongoId()
  @IsNotEmpty()
  treasureId: string;
}
