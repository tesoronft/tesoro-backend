import { Transform } from 'class-transformer';
import { IsMongoId, IsNotEmpty } from 'class-validator';

export class RevenueCatEventInnerDto {
  @IsNotEmpty()
  id: string;

  @IsNotEmpty()
  type:
    | 'INITIAL_PURCHASE'
    | 'RENEWAL'
    | 'EXPIRATION'
    | 'CANCELLATION'
    | 'PRODUCT_CHANGE';

  @IsNotEmpty()
  @IsMongoId()
  @Transform(({ value }) => value.trim())
  app_user_id: string;

  @IsNotEmpty()
  product_id: string;

  @IsNotEmpty()
  purchased_at_ms: number;

  @IsNotEmpty()
  expiration_at_ms: number;

  @IsNotEmpty()
  transaction_id: string;
}

