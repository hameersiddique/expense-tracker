import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, MaxLength, IsEnum } from 'class-validator';
import { ThemePreference } from '../../../entities';

export class UpdateSettingsDto {
  @ApiPropertyOptional({ example: 'KWD' }) @IsOptional() @IsString() @MaxLength(3) currency?: string;
  @ApiPropertyOptional({ example: 'en' }) @IsOptional() @IsString() @MaxLength(10) language?: string;
  @ApiPropertyOptional({ example: 'Asia/Kuwait' }) @IsOptional() @IsString() @MaxLength(100) timezone?: string;
  @ApiPropertyOptional({ enum: ThemePreference }) @IsOptional() @IsEnum(ThemePreference) theme?: ThemePreference;
}
