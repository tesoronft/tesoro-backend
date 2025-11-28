import { IsMongoId, IsNotEmpty } from "class-validator";

export class GetTreasureDto {
  @IsMongoId()
  @IsNotEmpty()
  treasureId: string;
}
