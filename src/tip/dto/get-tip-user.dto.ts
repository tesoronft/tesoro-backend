import { IsMongoId, IsNotEmpty, IsNumber } from 'class-validator';

export class GetTipDto {
  @IsNotEmpty()
  @IsMongoId()
  userId: string;
}
