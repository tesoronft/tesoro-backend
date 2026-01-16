import { Transform } from 'class-transformer';
import { IsString, IsOptional, IsNotEmpty } from 'class-validator';

export class CreateConditionDto {
  @IsNotEmpty()
  @IsString()
  @Transform(({ value }) => value.trim())
  name: string;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => value.trim())
  description?: string;
}
