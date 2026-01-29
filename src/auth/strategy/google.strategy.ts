import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { OAuth2Client } from 'google-auth-library';

@Injectable()
export class GoogleTokenService {
  private readonly client: OAuth2Client;

  constructor() {
    this.client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
  }

  async verifyIdToken(idToken: string) {
    try {
      console.log(`Google ID Token check: Length=${idToken?.length}`);
      if (idToken) {
        const segments = idToken.split('.');
        console.log(`Token segments count: ${segments.length}`);
        // Log first/last chars to check for obvious corruption without logging full token
        console.log(`Token start: ${idToken.substring(0, 10)}... end: ...${idToken.substring(idToken.length - 10)}`);
      }

      if (!idToken || idToken.split('.').length !== 3) {
        throw new BadRequestException('Invalid Google ID token');
      }
      const ticket = await this.client.verifyIdToken({
        idToken,
        audience: process.env.GOOGLE_CLIENT_ID,
      });

      const payload = ticket.getPayload();

      if (!payload || !payload.email) {
        throw new UnauthorizedException('Invalid token payload.');
      }

      return {
        email: payload.email.toLowerCase(),
        firstName: payload.given_name,
        lastName: payload.family_name,
        picture: payload.picture,
      };
    } catch (error) {
      console.log('Google Verify Error:', error);
      if (
        error instanceof BadRequestException ||
        error instanceof UnauthorizedException
      ) {
        throw error;
      }
      throw error;
    }
  }
}
