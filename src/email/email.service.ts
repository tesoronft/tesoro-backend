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

  async sendTreasureReportedEmail(
    email: string,
    userName: string,
    treasureTitle: string,
    reason: string,
    description?: string,
  ) {
    await this.mailer.sendMail({
      to: email,
      subject: 'Your Treasure Has Been Reported - Tesoro',
      template: 'treasure-reported',
      context: {
        userName: userName,
        treasureTitle: treasureTitle,
        reason: reason,
        description: description || '',
        year: new Date().getFullYear(),
      },
    });
  }
}
