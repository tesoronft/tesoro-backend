import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { authMessages } from 'src/common/messages';
import { authContants, ROLE } from 'src/common/constants';

export class CreateUserDto {
  @IsNotEmpty()
  @IsString()
  @Transform(({ value }) => value.trim())
  name: string;

  @IsNotEmpty()
  @IsString()
  @IsEmail()
  @Transform(({ value }) => value.toLowerCase())
  email: string;

  @IsNotEmpty()
  @IsString()
  @Matches(authContants.PASSWORD_REGEX_PATTERN, {
    message: authMessages.PASSWORD_INVALID_FORMAT,
  })
  password: string;

  @IsOptional()
  @IsString()
  profileImage?: string;

  @IsOptional()
  @IsEnum(ROLE)
  role?: ROLE;
}
