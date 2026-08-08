import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Transaction } from '../../entities';
import { ReportsService } from './reports.service';
import { ReportsController } from './reports.controller';
import { ExportService } from '../../common/services/export.service';

@Module({
  imports: [TypeOrmModule.forFeature([Transaction])],
  controllers: [ReportsController],
  providers: [ReportsService, ExportService],
})
export class ReportsModule {}
