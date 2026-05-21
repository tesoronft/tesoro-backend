import { IsMongoId, IsNotEmpty } from 'class-validator';

export class GetTreasureCollectDto {
  @IsNotEmpty()
  @IsMongoId()
  userId: string;
}
