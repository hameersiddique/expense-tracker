import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule } from '@nestjs/throttler';
import { APP_FILTER, APP_INTERCEPTOR, APP_GUARD } from '@nestjs/core';
import configuration from './config/configuration';
import {
  User, RefreshToken, Category, Subcategory, Account, PaymentMethod, Transaction, Attachment, AuditLog,
} from './entities';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { JwtAuthGuard } from './modules/auth/guards/jwt-auth.guard';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { CategoriesModule } from './modules/categories/categories.module';
import { SubcategoriesModule } from './modules/subcategories/subcategories.module';
import { AccountsModule } from './modules/accounts/accounts.module';
import { PaymentMethodsModule } from './modules/payment-methods/payment-methods.module';
import { TransactionsModule } from './modules/transactions/transactions.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { ReportsModule } from './modules/reports/reports.module';
import { UploadsModule } from './modules/uploads/uploads.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, load: [configuration] }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const url = configService.get<string>('database.url');
        const ssl = configService.get<boolean>('database.ssl')
          ? { rejectUnauthorized: false }
          : false;
        const base = url
          ? { url }
          : {
              host: configService.get<string>('database.host'),
              port: configService.get<number>('database.port'),
              username: configService.get<string>('database.username'),
              password: configService.get<string>('database.password'),
              database: configService.get<string>('database.database'),
            };
        return {
          type: 'postgres' as const,
          ...base,
          ssl,
          entities: [User, RefreshToken, Category, Subcategory, Account, PaymentMethod, Transaction, Attachment, AuditLog],
          synchronize: configService.get<boolean>('database.synchronize'),
          logging: configService.get<boolean>('database.logging'),
        };
      },
    }),
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        throttlers: [{ ttl: configService.get<number>('throttle.ttl') ?? 60000, limit: configService.get<number>('throttle.limit') ?? 100 }],
      }),
    }),
    AuthModule,
    UsersModule,
    CategoriesModule,
    SubcategoriesModule,
    AccountsModule,
    PaymentMethodsModule,
    TransactionsModule,
    DashboardModule,
    ReportsModule,
    UploadsModule,
  ],
  providers: [
    { provide: APP_FILTER, useClass: GlobalExceptionFilter },
    { provide: APP_INTERCEPTOR, useClass: LoggingInterceptor },
    { provide: APP_INTERCEPTOR, useClass: ResponseInterceptor },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
  ],
})
export class AppModule {}
