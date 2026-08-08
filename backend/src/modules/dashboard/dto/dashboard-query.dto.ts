import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsDateString } from 'class-validator';

export class DashboardQueryDto {
  @ApiPropertyOptional({ example: '2026-01-01' }) @IsOptional() @IsDateString() dateFrom?: string;
  @ApiPropertyOptional({ example: '2026-12-31' }) @IsOptional() @IsDateString() dateTo?: string;
}
