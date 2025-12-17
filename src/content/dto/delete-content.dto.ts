import { IsMongoId, IsNotEmpty } from 'class-validator';

export class DeleteContentDto {
  @IsNotEmpty()
  @IsMongoId()
  contentId: string;
}
