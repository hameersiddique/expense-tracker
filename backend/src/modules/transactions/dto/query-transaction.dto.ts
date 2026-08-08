import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsOptional, IsEnum, IsUUID, IsDateString, IsNumber } from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { TransactionType } from '../../../entities';

export class QueryTransactionDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: TransactionType }) @IsOptional() @IsEnum(TransactionType) type?: TransactionType;
  @ApiPropertyOptional() @IsOptional() @IsUUID() categoryId?: string;
  @ApiPropertyOptional() @IsOptional() @IsUUID() subcategoryId?: string;
  @ApiPropertyOptional() @IsOptional() @IsUUID() paymentMethodId?: string;
  @ApiPropertyOptional() @IsOptional() @IsUUID() accountId?: string;
  @ApiPropertyOptional({ example: '2026-01-01' }) @IsOptional() @IsDateString() dateFrom?: string;
  @ApiPropertyOptional({ example: '2026-12-31' }) @IsOptional() @IsDateString() dateTo?: string;
  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsNumber() amountMin?: number;
  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsNumber() amountMax?: number;
}
