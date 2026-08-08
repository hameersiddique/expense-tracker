import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsEnum, IsOptional, MaxLength, IsBoolean } from 'class-validator';
import { PaymentMethodType } from '../../../entities';

export class CreatePaymentMethodDto {
  @ApiProperty({ enum: PaymentMethodType }) @IsEnum(PaymentMethodType) type: PaymentMethodType;
  @ApiProperty({ example: 'KFH Visa' }) @IsString() @MaxLength(100) name: string;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() isDefault?: boolean;
}
