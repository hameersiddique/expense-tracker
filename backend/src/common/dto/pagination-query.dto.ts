import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Max, Min, IsIn } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class PaginationQueryDto {
  @ApiPropertyOptional({ default: 1, minimum: 1 })
  @IsOptional() @Type(() => Number) @IsInt() @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 20, minimum: 1, maximum: 100 })
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(100)
  limit?: number = 20;

  @ApiPropertyOptional() @IsOptional() @IsString()
  sortBy?: string;

  @ApiPropertyOptional({ enum: ['ASC', 'DESC'], default: 'DESC' })
  @IsOptional() @IsIn(['ASC', 'DESC'])
  sortOrder?: 'ASC' | 'DESC' = 'DESC';

  @ApiPropertyOptional() @IsOptional() @IsString()
  search?: string;
}

export interface PaginatedResult<T> {
  items: T[];
  meta: { totalItems: number; itemCount: number; itemsPerPage: number; totalPages: number; currentPage: number; };
}

export function buildPaginatedResult<T>(items: T[], totalItems: number, page: number, limit: number): PaginatedResult<T> {
  return {
    items,
    meta: {
      totalItems, itemCount: items.length, itemsPerPage: limit,
      totalPages: Math.ceil(totalItems / limit) || 1, currentPage: page,
    },
  };
}
