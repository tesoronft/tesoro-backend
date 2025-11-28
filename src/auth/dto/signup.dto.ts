import {
  IsEmail,
  IsString,
  IsNotEmpty,
  Matches,
  MaxLength,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { authMessages } from 'src/common/messages';
import { authContants } from 'src/common/constants';

export class SignupDto {
  @IsNotEmpty()
  @IsString()
  @MaxLength(25)
  @Transform(({ value }) => value.trim())
  name: string;

  @IsNotEmpty()
  @IsString()
  @IsEmail()
  @Transform(({ value }) => value.toLowerCase())
  email: string;

  @IsNotEmpty()
  @IsString()
  @MaxLength(20)
  @Matches(authContants.PASSWORD_REGEX_PATTERN, {
    message: authMessages.PASSWORD_INVALID_FORMAT,
  })
  password: string;

}
