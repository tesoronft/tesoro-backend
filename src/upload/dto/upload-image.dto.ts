import { IsNotEmpty, IsEnum, IsString } from 'class-validator';
import { Transform } from 'class-transformer';

export enum UploadFolder {
  USER_PROFILES = 'user-profiles',
  TREASURES = 'treasures',
}

export class UploadImageDto {
  @IsNotEmpty()
  @IsEnum(UploadFolder, {
    message: 'folder must be either "user-profiles" or "treasures"',
  })
  @Transform(({ value }) => value?.trim().toLowerCase())
  folder: UploadFolder;
}

