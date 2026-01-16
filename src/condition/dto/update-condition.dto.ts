import { Transform } from 'class-transformer';
import { IsString, IsOptional, IsMongoId, IsNotEmpty } from 'class-validator';

export class UpdateConditionDto {
  @IsNotEmpty()
  @IsMongoId()
  @IsString()
  @Transform(({ value }) => value.trim())
  conditionId: string;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => value.trim())
  name: string;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => value.trim())
  description?: string;
}
