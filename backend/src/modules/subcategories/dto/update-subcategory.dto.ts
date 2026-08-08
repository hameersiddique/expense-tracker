import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, MaxLength } from 'class-validator';
export class UpdateSubcategoryDto { @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(100) name?: string; }
