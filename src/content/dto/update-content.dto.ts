import { IsMongoId, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';

export class UpdateContentDto {
  @IsNotEmpty()
  @IsMongoId()
  contentId: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  name?: string;

  @IsOptional()
  @IsString()
  content?: string;
}
