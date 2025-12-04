import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  Res,
  UnauthorizedException,
} from '@nestjs/common';
import {
  ForgotPasswordDto,
  LoginDto,
  RefreshTokenDto,
  ResetPasswordDto,
  SignupDto,
  TokenDto,
  VerifyOtpDto,
} from './dto';
import { authMessages } from 'src/common/messages';
import * as bcrypt from 'bcrypt';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { GoogleTokenService } from './strategy';
import { InjectModel } from '@nestjs/mongoose';
import { User } from 'src/user/schema';
import { Model } from 'mongoose';
import { ROLE } from 'src/common/constants';
import { TokenSender } from './utils/tokenSender';
import { EmailService } from 'src/email/email.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly config: ConfigService,
    private readonly jwtService: JwtService,
    private readonly googleTokenService: GoogleTokenService,
    @InjectModel(User.name) private userModel: Model<User>,
    private readonly emailService: EmailService,
  ) {}

  async signup(signupDto: SignupDto): Promise<any> {
    try {
      const { name, email, password } = signupDto;

      const user = await this.userModel.findOne({ email });

      if (user?.isDeleted) {
        throw new UnauthorizedException(authMessages.USER_DELETED);
      }

      if (user?.isBlocked) {
        throw new UnauthorizedException(authMessages.USER_BLOCKED);
      }

      if (user) {
        throw new ConflictException(authMessages.EMAIL_ALREADY_EXISTS);
      }

      const hashedPassword = await bcrypt.hash(
        password,
        parseInt(this.config.get('SALT_ROUNDS') || '10'),
      );

      return await this.userModel.create({
        name,
        email,
        password: hashedPassword,
        role: ROLE.USER,
      });
    } catch (error) {
      console.log(error);
      if (error.code === 'P2002') {
        throw new ForbiddenException(authMessages.CREDENTIALS_TAKEN);
      }
      if (error.code === 11000) {
        throw new ConflictException(authMessages.EMAIL_ALREADY_EXISTS);
      }
      throw error;
    }
  }

  async login(payload: LoginDto): Promise<any> {
    try {
      const { email, password } = payload;

      const user = await this.findUser(email);

      if (!user?.password) {
        throw new ConflictException(authMessages.PASSWORD_NOT_SET_PLEASE_RESET);
      }

      if (!(await this.comparePassword(password, user.password))) {
        throw new ForbiddenException(authMessages.INVALID_CREDENTIALS);
      }

      const loginPayload = {
        _id: String(user._id),
        name: user.name,
        email: user.email,
        role: user.role,
      };

      const {accessToken,refreshToken} = await this.processLogin(user, loginPayload);

       return { accessToken,refreshToken };

    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  async loginWithGoogle(payload: TokenDto): Promise<any> {
    try {
      const { email, firstName, lastName } =
        await this.googleTokenService.verifyIdToken(payload.token);

      let user = await this.userModel.findOne({ email });

      if (user?.isDeleted) {
        throw new UnauthorizedException(authMessages.USER_DELETED);
      }

      if (user?.isBlocked) {
        throw new UnauthorizedException(authMessages.USER_BLOCKED);
      }

      if (!user) {
        const name = (firstName + ' ' + lastName).trim();
        user = await this.userModel.create({
          email,
          name,
          role: ROLE.USER,
        });
      }

      const tokenPayload = {
        _id: String(user._id),
        name: user.name,
        email: user.email,
        role: user.role,
      };

      const {accessToken,refreshToken} = await this.processLogin(user, tokenPayload);

    return { accessToken,refreshToken };
    } catch (error) {
      console.error('Google login error:', error);
      throw error;
    }
  }

  async refreshToken(payload: RefreshTokenDto): Promise<any> {
    try {
    const { refreshToken } = payload;

      const decoded = this.jwtService.verify(refreshToken, {
        secret: this.config.get<string>('JWT_REFRESH_TOKEN_SECRET'),
      });

      const user = await this.userModel.findById(decoded._id);
      if (!user || user.refreshToken !== refreshToken) {
        throw new UnauthorizedException('Invalid or revoked refresh token');
      }

      const tokenSender = new TokenSender(this.config, this.jwtService);
      const accessToken = await tokenSender.createAccessToken({
        _id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
      });

      const newRefreshToken = await tokenSender.createRefreshToken({
        _id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
      });

      user.refreshToken = newRefreshToken;
      await user.save();

      return { accessToken, refreshToken: newRefreshToken };
    } catch (error) {
      console.log(error);
       if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
      throw error;
    }
  }

  async forgotPassword(payload: ForgotPasswordDto): Promise<any> {
    try {
      const { email } = payload;
      const user = await this.findUser(email);

      const otp = this.generateOtp();
      const hashedOtp = await this.hashOtp(otp);

      await this.userModel.updateOne(
        { email },
        {
          otp: hashedOtp,
          otpExpiry: new Date(Date.now() + 10 * 60 * 1000),
          otpAttempts: 0,
        },
      );
      setImmediate(() => {
        try {
          this.emailService.sendOtpEmail(user.email, otp);
        } catch (error) {
          console.log(error);
        }
      });
      return { message: 'OTP sent to your email' };
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  async verifyOtp(payload: VerifyOtpDto): Promise<any> {
    try {
      const { email, otp } = payload;

      const user = await this.findUser(email);

      if (!user.otp || !user.otpExpiry) {
        throw new BadRequestException(
          'No OTP found. Please request a new one.',
        );
      }

      if (user.otpAttempts >= 5) {
        throw new BadRequestException(
          'Maximum OTP attempts reached. Request a new OTP.',
        );
      }

      if (new Date() > user.otpExpiry) {
        throw new BadRequestException('OTP has expired. Request a new one.');
      }

      const isOtpValid = await bcrypt.compare(otp, user.otp);
      if (!isOtpValid) {
        await this.userModel.findOneAndUpdate(
          { email },
          { $inc: { otpAttempts: 1 } },
        );
        throw new BadRequestException('Invalid OTP');
      }

      await this.userModel.findByIdAndUpdate(user._id, {
        isOtpVerified: true,
        otp: null,
        otpExpiry: null,
        otpAttempts: 0,
      });

      return { message: 'OTP verified successfully' };
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  async resetPassword(payload: ResetPasswordDto): Promise<any> {
    const { email, newPassword } = payload;

    const user = await this.findUser(email);

    if (!user.isOtpVerified) {
      throw new BadRequestException('OTP not verified. Cannot reset password.');
    }

    const hashedPassword = await bcrypt.hash(
      newPassword,
      parseInt(this.config.get('SALT_ROUNDS') || '10'),
    );

    await this.userModel.findOneAndUpdate(
      { email },
      {
        $set: {
          password: hashedPassword,
          otp: null,
          otpExpiry: null,
          otpAttempts: 0,
          isOtpVerified: false,
          passwordResetAt: new Date(),
        },
      },
    );

    return { message: 'Password reset successfully' };
  }

  async findUser(email):Promise<any> {
    try {
      const user = await this.userModel.findOne({ email }).lean().exec();

      if (!user) {
        throw new NotFoundException(authMessages.USER_NOT_FOUND);
      }

      if (user?.isDeleted) {
        throw new UnauthorizedException(authMessages.USER_DELETED);
      }

      if (user?.isBlocked) {
        throw new UnauthorizedException(authMessages.USER_BLOCKED);
      }

      return user;
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  private async comparePassword(
    password: string,
    hashedPassword: string,
  ): Promise<boolean> {
    return await bcrypt.compare(password, hashedPassword);
  }

  private async processLogin(user: User,payload: {
    _id: string;
    name: string;
    email: string;
    role: ROLE;
  }): Promise<any> {
    try {
      const tokenSender = new TokenSender(this.config, this.jwtService);
      
    const [accessToken, refreshToken] = await Promise.all([
        tokenSender.createAccessToken(payload),
        tokenSender.createRefreshToken(payload),
      ]);

    await this.userModel.updateOne(
      { _id: user._id },
      { refreshToken: refreshToken }
    );


    return {accessToken,refreshToken};
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  generateOtp(): string {
    return Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit
  }

  hashOtp(otp: string): Promise<string> {
    return bcrypt.hash(otp, 10);
  }

  compareOtp(otp: string, hashedOtp: string): Promise<boolean> {
    return bcrypt.compare(otp, hashedOtp);
  }
}
