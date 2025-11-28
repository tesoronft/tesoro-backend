import { Injectable } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';

@Injectable()
export class EmailService {
  constructor(private readonly mailer: MailerService) {}

  async sendOtpEmail(email: string, otp: string) {
    await this.mailer.sendMail({
      to: email,
      subject: 'Your OTP Code - Tesoro',
      template: 'otp',
      context: {
        otp: otp,
        year: new Date().getFullYear(),
      },
    });
  }
}
