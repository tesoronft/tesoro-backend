import { IsOptional } from 'class-validator';
import { Transform } from 'class-transformer';

export class GetTipsQueryDto {
  @IsOptional()
  @Transform(({ value }) => Number(value))
  page?: number = 1;

  @IsOptional()
  @Transform(({ value }) => Number(value))
  limit?: number = 15;
}
