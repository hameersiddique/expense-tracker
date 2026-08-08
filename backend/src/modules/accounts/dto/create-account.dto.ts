import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, MaxLength, IsNumber, IsBoolean } from 'class-validator';

export class CreateAccountDto {
  @ApiProperty({ example: 'NBK Savings' }) @IsString() @MaxLength(100) name: string;
  @ApiPropertyOptional({ example: 0 }) @IsOptional() @IsNumber() initialBalance?: number;
  @ApiPropertyOptional({ example: 'KWD' }) @IsOptional() @IsString() @MaxLength(3) currency?: string;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() isDefault?: boolean;
}
