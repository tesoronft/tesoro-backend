import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from 'src/user/schema';
import { ConfigService } from '@nestjs/config';
import { authMessages } from 'src/common/messages';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { JsonWebTokenError, TokenExpiredError } from '@nestjs/jwt';

@Injectable()
export class JwtAuthStrategy extends PassportStrategy(
  Strategy,
  'jwt-auth-strategy',
) {
  constructor(
    private configService: ConfigService,
    @InjectModel(User.name) private userModel: Model<User>,
    private reflector: Reflector,
  ) {
    const jwtSecret = configService.get<string>('JWT_ACCESS_TOKEN_SECRET');
    if (!jwtSecret) {
      throw new UnauthorizedException('JWT_ACCESS_TOKEN_SECRET is not defined');
    }

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: jwtSecret,
      passReqToCallback: true,
    });
  }

  async validate(
    req: Request,
    payload: { _id: string; email: string },
  ): Promise<any> {
    try {
      const user = await this.userModel
        .findById(payload._id)
        .select('-password')
        .lean();

      if (!user) {
        throw new UnauthorizedException(authMessages.USER_NOT_FOUND);
      }

      if (user.isDeleted) {
        throw new UnauthorizedException(authMessages.USER_DELETED);
      }

      if (user.isBlocked) {
        throw new UnauthorizedException(authMessages.USER_BLOCKED);
      }

      return {
        ...user,
        _id: user._id.toString(),
      };
    } catch (error) {
      console.log(error);
      if (error instanceof TokenExpiredError) {
        throw new UnauthorizedException(authMessages.TOKEN_EXPIRED);
      } else
      if (error instanceof JsonWebTokenError) {
        throw new UnauthorizedException(authMessages.INVALID_TOKEN);
      }
      throw error;
    }
  }
}
