import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan, QueryFailedError } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { User, RefreshToken } from '../../entities';
import { DefaultDataSeederService } from '../../database/seeds/default-data-seeder.service';
import { MailerService } from './mailer.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { ChangePasswordDto } from './dto/change-password.dto';

const BCRYPT_ROUNDS = 12;

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResult extends AuthTokens {
  user: Partial<User>;
}

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private usersRepository: Repository<User>,
    @InjectRepository(RefreshToken) private refreshTokenRepository: Repository<RefreshToken>,
    private jwtService: JwtService,
    private configService: ConfigService,
    private defaultDataSeeder: DefaultDataSeederService,
    private mailerService: MailerService,
  ) {}

  async register(dto: RegisterDto): Promise<AuthResult> {
    const existing = await this.usersRepository.findOne({ where: { email: dto.email.toLowerCase() } });
    if (existing) {
      throw new ConflictException('An account with this email already exists');
    }

    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);

    const user = await this.usersRepository.save(
      this.usersRepository.create({
        firstName: dto.firstName,
        lastName: dto.lastName,
        email: dto.email.toLowerCase(),
        passwordHash,
        emailVerificationToken: crypto.randomBytes(32).toString('hex'),
      }),
    );

    await this.defaultDataSeeder.seedForUser(user.id);
    await this.mailerService.sendWelcomeEmail(user.email, user.firstName);

    const tokens = await this.issueTokens(user, false);
    return { ...tokens, user: this.sanitizeUser(user) };
  }

  async login(dto: LoginDto, userAgent?: string, ipAddress?: string): Promise<AuthResult> {
    const user = await this.usersRepository.findOne({ where: { email: dto.email.toLowerCase() } });
    if (!user || !user.isActive) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const passwordMatches = await bcrypt.compare(dto.password, user.passwordHash);
    if (!passwordMatches) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const tokens = await this.issueTokens(user, !!dto.rememberMe, userAgent, ipAddress);
    return { ...tokens, user: this.sanitizeUser(user) };
  }

  async refresh(refreshTokenValue: string): Promise<AuthTokens> {
    let payload: { sub: string; email: string };
    try {
      payload = await this.jwtService.verifyAsync(refreshTokenValue, {
        secret: this.configService.get<string>('jwt.refreshSecret'),
      });
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    const tokenHash = this.hashToken(refreshTokenValue);
    const storedToken = await this.refreshTokenRepository.findOne({
      where: { tokenHash, userId: payload.sub },
    });

    if (!storedToken || storedToken.isRevoked || storedToken.expiresAt < new Date()) {
      throw new UnauthorizedException('Refresh token is invalid or has been revoked');
    }

    const user = await this.usersRepository.findOne({ where: { id: payload.sub } });
    if (!user || !user.isActive) {
      throw new UnauthorizedException('User not found or inactive');
    }

    storedToken.isRevoked = true;
    await this.refreshTokenRepository.save(storedToken);

    const wasLongLived = this.isLongLived(storedToken.expiresAt, storedToken.createdAt);
    const tokens = await this.issueTokens(user, wasLongLived);
    return tokens;
  }

  async logout(refreshTokenValue: string): Promise<void> {
    const tokenHash = this.hashToken(refreshTokenValue);
    await this.refreshTokenRepository.update({ tokenHash }, { isRevoked: true });
  }

  async forgotPassword(dto: ForgotPasswordDto): Promise<{ message: string }> {
    const user = await this.usersRepository.findOne({ where: { email: dto.email.toLowerCase() } });
    const genericResponse = {
      message: 'If an account with that email exists, a password reset link has been sent.',
    };
    if (!user) return genericResponse;

    const rawToken = crypto.randomBytes(32).toString('hex');
    user.passwordResetToken = this.hashToken(rawToken);
    user.passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000);
    await this.usersRepository.save(user);

    const frontendUrl = this.configService.get<string>('frontendUrl');
    const resetUrl = `${frontendUrl}/reset-password?token=${rawToken}`;
    await this.mailerService.sendPasswordResetEmail(user.email, resetUrl);

    return genericResponse;
  }

  async resetPassword(dto: ResetPasswordDto): Promise<{ message: string }> {
    const tokenHash = this.hashToken(dto.token);
    const user = await this.usersRepository.findOne({
      where: { passwordResetToken: tokenHash, passwordResetExpires: MoreThan(new Date()) },
    });
    if (!user) throw new BadRequestException('Password reset token is invalid or has expired');

    user.passwordHash = await bcrypt.hash(dto.newPassword, BCRYPT_ROUNDS);
    user.passwordResetToken = null;
    user.passwordResetExpires = null;
    await this.usersRepository.save(user);

    await this.refreshTokenRepository.update({ userId: user.id }, { isRevoked: true });

    return { message: 'Password has been reset successfully' };
  }

  async changePassword(userId: string, dto: ChangePasswordDto): Promise<{ message: string }> {
    const user = await this.usersRepository.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const matches = await bcrypt.compare(dto.currentPassword, user.passwordHash);
    if (!matches) throw new BadRequestException('Current password is incorrect');

    user.passwordHash = await bcrypt.hash(dto.newPassword, BCRYPT_ROUNDS);
    await this.usersRepository.save(user);

    return { message: 'Password changed successfully' };
  }

  async getProfile(userId: string): Promise<Partial<User>> {
    const user = await this.usersRepository.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');
    return this.sanitizeUser(user);
  }

  private async issueTokens(
    user: User,
    longLived: boolean,
    userAgent?: string,
    ipAddress?: string,
  ): Promise<AuthTokens> {
    const payload = { sub: user.id, email: user.email };

    const accessToken = await this.jwtService.signAsync(payload, {
      secret: this.configService.get<string>('jwt.accessSecret'),
      expiresIn: this.configService.get<string>('jwt.accessExpiresIn'),
    } as Record<string, unknown>);

    const refreshExpiresIn = longLived ? '30d' : this.configService.get<string>('jwt.refreshExpiresIn');
    const expiresAt = this.computeExpiry(refreshExpiresIn as string);
    let refreshToken: string;
    let retries = 0;
    const maxRetries = 5;

    while (true) {
      if (retries >= maxRetries) {
        throw new Error('Unable to generate a unique refresh token after multiple attempts');
      }

      refreshToken = await this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>('jwt.refreshSecret'),
        expiresIn: refreshExpiresIn,
        jwtid: crypto.randomBytes(16).toString('hex'),
      } as Record<string, unknown>);

      try {
        await this.refreshTokenRepository.save(
          this.refreshTokenRepository.create({
            userId: user.id,
            tokenHash: this.hashToken(refreshToken),
            expiresAt,
            userAgent: userAgent ?? null,
            ipAddress: ipAddress ?? null,
          }),
        );
        break;
      } catch (error) {
        retries += 1;
        if (error instanceof QueryFailedError && (error.driverError as { code?: string }).code === '23505') {
          continue;
        }
        throw error;
      }
    }

    return { accessToken, refreshToken };
  }

  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  private computeExpiry(duration: string): Date {
    const match = /^(\d+)([smhd])$/.exec(duration);
    const now = Date.now();
    if (!match) return new Date(now + 7 * 24 * 60 * 60 * 1000);
    const value = parseInt(match[1], 10);
    const unitMs = { s: 1000, m: 60000, h: 3600000, d: 86400000 }[match[2]] ?? 86400000;
    return new Date(now + value * unitMs);
  }

  private isLongLived(expiresAt: Date, createdAt: Date): boolean {
    const diffDays = (expiresAt.getTime() - createdAt.getTime()) / 86400000;
    return diffDays > 14;
  }

  private sanitizeUser(user: User): Partial<User> {
    const { passwordHash, passwordResetToken, emailVerificationToken, ...rest } = user;
    void passwordHash;
    void passwordResetToken;
    void emailVerificationToken;
    return rest;
  }
}
