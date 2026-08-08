import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Transaction, Category } from '../../entities';
import { TransactionsService } from './transactions.service';
import { TransactionsController } from './transactions.controller';
import { ExportService } from '../../common/services/export.service';

@Module({
  imports: [TypeOrmModule.forFeature([Transaction, Category])],
  controllers: [TransactionsController],
  providers: [TransactionsService, ExportService],
  exports: [TransactionsService],
})
export class TransactionsModule {}
