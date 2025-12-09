import { IsMongoId, IsNotEmpty, IsNumber } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateTipDto {
  @IsNotEmpty()
  @IsMongoId()
  givenUser: string;

  @IsNotEmpty()
  @IsMongoId()
  receivedUser: string;

  @IsNotEmpty()
  @IsMongoId()
  treasure: string;

  @IsNotEmpty()
  @IsNumber()
  @Transform(({ value }) => Number(value))
  amount: number;
}
