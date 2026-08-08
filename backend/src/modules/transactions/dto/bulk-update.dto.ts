import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsUUID, ArrayMinSize, IsOptional, IsEnum } from 'class-validator';
import { TransactionType } from '../../../entities';

export class BulkUpdateDto {
  @ApiProperty({ type: [String] }) @IsArray() @ArrayMinSize(1) @IsUUID('4', { each: true }) ids: string[];
  @ApiPropertyOptional({ enum: TransactionType }) @IsOptional() @IsEnum(TransactionType) type?: TransactionType;
  @ApiPropertyOptional() @IsOptional() @IsUUID() categoryId?: string;
  @ApiPropertyOptional() @IsOptional() @IsUUID() subcategoryId?: string;
  @ApiPropertyOptional() @IsOptional() @IsUUID() paymentMethodId?: string;
  @ApiPropertyOptional() @IsOptional() @IsUUID() accountId?: string;
}
