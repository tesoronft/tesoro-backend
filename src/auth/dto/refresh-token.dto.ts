import { Transform } from 'class-transformer';
import {
  IsNotEmpty,
  IsString,
} from 'class-validator';

export class RefreshTokenDto {
  @IsNotEmpty({ message: 'RefreshToken is required' })
  @IsString()
  @Transform(({ value }) => value.trim())
  refreshToken: string;
}
