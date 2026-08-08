import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsEnum, IsDateString, IsUUID } from 'class-validator';
import { TransactionType } from '../../../entities';

export enum ExportFormat { CSV = 'csv', EXCEL = 'excel', PDF = 'pdf' }

export class ExportQueryDto {
  @ApiPropertyOptional({ enum: ExportFormat, default: ExportFormat.CSV }) @IsOptional() @IsEnum(ExportFormat) format?: ExportFormat = ExportFormat.CSV;
  @ApiPropertyOptional({ enum: TransactionType }) @IsOptional() @IsEnum(TransactionType) type?: TransactionType;
  @ApiPropertyOptional() @IsOptional() @IsUUID() categoryId?: string;
  @ApiPropertyOptional() @IsOptional() @IsDateString() dateFrom?: string;
  @ApiPropertyOptional() @IsOptional() @IsDateString() dateTo?: string;
}
