import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Transaction, Account, PaymentMethod } from '../../entities';
import { DashboardService } from './dashboard.service';
import { DashboardController } from './dashboard.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Transaction, Account, PaymentMethod])],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
