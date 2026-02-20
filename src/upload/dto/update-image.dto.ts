import { IsNotEmpty, IsEnum, IsOptional, IsString } from 'class-validator';
import { Transform } from 'class-transformer';
import { UploadFolder } from './upload-image.dto';

export class UpdateImageDto {
  @IsNotEmpty()
  @IsEnum(UploadFolder, {
    message: 'folder must be either "user-profiles" or "treasures"',
  })
  @Transform(({ value }) => value?.trim().toLowerCase())
  folder: UploadFolder;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => value?.trim())
  oldImageKey?: string; // S3 key of the old image to delete (e.g., "user-profiles/123-abc.jpg")
}

