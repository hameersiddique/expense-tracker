import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';
export class MoveSubcategoryDto { @ApiProperty() @IsUUID() targetCategoryId: string; }
