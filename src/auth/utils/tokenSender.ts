import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { TokenPayload } from '../dto/token.dto';

export class TokenSender {
  constructor(
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
  ) {}

  public async createAccessToken(payload: TokenPayload) {
    try {
      const accessToken = this.jwtService.sign(
        {
          _id: payload._id,
          email: payload.email,
          name: payload.name,
          role: payload.role,
        },
        {
          secret: this.configService.get<string>('JWT_ACCESS_TOKEN_SECRET'),
          expiresIn: this.configService.get('JWT_ACCESS_TOKEN_EXPIRE_IN'),
        },
      );
      return accessToken;
    } catch (error) {
      throw error;
    }
  }

  public async createRefreshToken(payload: TokenPayload) {
    try {
      const refreshToken = this.jwtService.sign(
        {
          _id: payload._id,
          email: payload.email,
          name: payload.name,
          role: payload.role,
        },
        {
          secret: this.configService.get<string>('JWT_REFRESH_TOKEN_SECRET'),
          expiresIn: this.configService.get('JWT_REFRESH_TOKEN_EXPIRE_IN'),
        },
      );
      return refreshToken;
    } catch (error) {
      throw error;
    }
  }
}
