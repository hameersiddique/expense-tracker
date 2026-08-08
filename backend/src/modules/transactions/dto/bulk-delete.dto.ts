import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsUUID, ArrayMinSize } from 'class-validator';
export class BulkDeleteDto {
  @ApiProperty({ type: [String] }) @IsArray() @ArrayMinSize(1) @IsUUID('4', { each: true }) ids: string[];
}
