import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';
import { authContants } from 'src/common/constants';
import { authMessages } from 'src/common/messages';

export class ForgotPasswordDto {
  @IsNotEmpty()
  @IsString()
  @IsEmail()
  @Transform(({ value }) => value.toLowerCase())
  email: string;
}

export class ResetPasswordDto {
  @IsNotEmpty({ message: 'Token is required' })
  @IsString()
  token: string;

  @IsNotEmpty()
  @IsString()
  @MaxLength(20)
  @Matches(authContants.PASSWORD_REGEX_PATTERN, {
    message: authMessages.PASSWORD_INVALID_FORMAT,
  })
  newPassword: string;
}
