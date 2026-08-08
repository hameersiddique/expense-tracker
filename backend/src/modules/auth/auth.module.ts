import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { User, RefreshToken } from '../../entities';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './strategies/jwt.strategy';
import { MailerService } from './mailer.service';
import { DefaultDataSeederService } from '../../database/seeds/default-data-seeder.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, RefreshToken]),
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) =>
        ({
          secret: configService.get<string>('jwt.accessSecret'),
          signOptions: { expiresIn: configService.get<string>('jwt.accessExpiresIn') },
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        }) as any,
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, MailerService, DefaultDataSeederService],
  exports: [AuthService],
})
export class AuthModule {}
