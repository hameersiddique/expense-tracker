import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsUUID, MaxLength } from 'class-validator';

export class CreateSubcategoryDto {
  @ApiProperty({ example: 'Dog Food' }) @IsString() @MaxLength(100) name: string;
  @ApiProperty() @IsUUID() categoryId: string;
}
