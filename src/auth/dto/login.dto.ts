import {
  IsEmail,
  IsString,
  IsNotEmpty,
  MaxLength,
  Matches,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { authContants } from 'src/common/constants';
import { authMessages } from 'src/common/messages';

export class LoginDto {
  @IsNotEmpty()
  @IsString()
  @IsEmail()
  @Transform(({ value }) => value.toLowerCase())
  email: string;

  @IsNotEmpty()
  @IsString()
  password: string;
}

export class ForgotPasswordDto {
  @IsNotEmpty()
  @IsString()
  @IsEmail()
  @Transform(({ value }) => value.toLowerCase())
  email: string;
}

export class VerifyOtpDto {
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsString()
  @IsNotEmpty()
  otp: string;
}

export class ResetPasswordDto {
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  @Matches(authContants.PASSWORD_REGEX_PATTERN, {
    message: authMessages.PASSWORD_INVALID_FORMAT,
  })
  newPassword: string;
}
