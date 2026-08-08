import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsDateString } from 'class-validator';

export enum ReportPeriod { DAILY = 'daily', WEEKLY = 'weekly', MONTHLY = 'monthly', QUARTERLY = 'quarterly', YEARLY = 'yearly', CUSTOM = 'custom' }
export enum ReportFormat { PDF = 'pdf', EXCEL = 'excel', CSV = 'csv' }

export class ReportQueryDto {
  @ApiProperty({ enum: ReportPeriod }) @IsEnum(ReportPeriod) period: ReportPeriod;
  @ApiPropertyOptional({ enum: ReportFormat, default: ReportFormat.PDF }) @IsOptional() @IsEnum(ReportFormat) format?: ReportFormat = ReportFormat.PDF;
  @ApiPropertyOptional({ example: '2026-01-01' }) @IsOptional() @IsDateString() dateFrom?: string;
  @ApiPropertyOptional({ example: '2026-12-31' }) @IsOptional() @IsDateString() dateTo?: string;
}
