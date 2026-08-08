import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsEnum, IsOptional, MaxLength } from 'class-validator';
import { CategoryType } from '../../../entities';

export class CreateCategoryDto {
  @ApiProperty({ example: 'Pets' }) @IsString() @MaxLength(100) name: string;
  @ApiProperty({ enum: CategoryType }) @IsEnum(CategoryType) type: CategoryType;
  @ApiPropertyOptional({ example: 'pets' }) @IsOptional() @IsString() @MaxLength(50) icon?: string;
  @ApiPropertyOptional({ example: '#795548' }) @IsOptional() @IsString() @MaxLength(20) color?: string;
}
