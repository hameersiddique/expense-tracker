import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsString, IsOptional, IsBoolean } from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: 'jane.doe@example.com' }) @IsEmail() email: string;
  @ApiProperty({ example: 'StrongP@ss123' }) @IsString() password: string;
  @ApiPropertyOptional({ default: false }) @IsOptional() @IsBoolean() rememberMe?: boolean;
}
