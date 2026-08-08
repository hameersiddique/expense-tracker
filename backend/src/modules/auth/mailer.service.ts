import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class MailerService {
  private readonly logger = new Logger('MailerService');
  async sendPasswordResetEmail(to: string, resetUrl: string): Promise<void> {
    this.logger.log(`[EMAIL] Password reset link for ${to}: ${resetUrl} (configure a real provider in production)`);
  }
  async sendWelcomeEmail(to: string, firstName: string): Promise<void> {
    this.logger.log(`[EMAIL] Welcome email queued for ${firstName} <${to}>`);
  }
  async sendEmailVerification(to: string, verifyUrl: string): Promise<void> {
    this.logger.log(`[EMAIL] Verification link for ${to}: ${verifyUrl}`);
  }
}
