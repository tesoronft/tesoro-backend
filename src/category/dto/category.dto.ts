import {
  IsMongoId,
  IsNotEmpty,
} from 'class-validator';

export class CategoryDto {
  @IsNotEmpty()
  @IsMongoId()
  categoryId: string;
}
