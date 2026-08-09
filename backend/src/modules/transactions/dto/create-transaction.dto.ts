import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNumber, IsUUID, IsDateString, IsOptional, IsString, Min, MaxLength, Matches, ValidateIf } from 'class-validator';
import { TransactionType } from '../../../entities';

export class CreateTransactionDto {
  @ApiProperty({ enum: TransactionType }) @IsEnum(TransactionType) type: TransactionType;
  @ApiProperty({ example: 25.5 }) @IsNumber({ maxDecimalPlaces: 2 }) @Min(0.01) amount: number;
  @ApiProperty() @IsUUID() categoryId: string;
  @ApiPropertyOptional() @IsOptional() @IsUUID() subcategoryId?: string;
  @ApiProperty({ example: '2026-06-30' }) @IsDateString() date: string;
  @ApiPropertyOptional({ example: '14:30' }) @IsOptional() @IsString() @Matches(/^\d{2}:\d{2}$/, { message: 'Time must be HH:mm' }) time?: string;
  @ApiPropertyOptional() @IsOptional() @IsUUID() paymentMethodId?: string;
  @ApiPropertyOptional() @IsOptional() @IsUUID() accountId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(1000) notes?: string;
}
