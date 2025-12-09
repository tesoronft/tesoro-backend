import { IsMongoId, IsNotEmpty, IsNumber, Max, Min } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateRatingDto {
  @IsNotEmpty()
  @IsMongoId()
  userId: string;

  @IsNotEmpty()
  @IsMongoId()
  treasureId: string;

  @IsNotEmpty()
  @IsNumber()
  @Min(1)
  @Max(5)
  rate: number;
}
