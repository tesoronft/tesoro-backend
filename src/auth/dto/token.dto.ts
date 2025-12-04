import { Transform } from 'class-transformer';
import { IsNotEmpty, IsString } from 'class-validator';
import { ROLE } from 'src/common/constants';

export interface TokenPayload {
  _id: string;
  name: string;
  email: string;
  role: ROLE;
}

export class TokenDto {
  @IsNotEmpty({ message: 'Token is required' })
  @IsString()
  @Transform(({ value }) => value.trim())
  token: string;
}
