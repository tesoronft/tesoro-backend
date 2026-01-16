import { IsMongoId, IsNotEmpty } from 'class-validator';

export class ConditionDto {
  @IsNotEmpty()
  @IsMongoId()
  conditionId: string;
}
