import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength, MaxLength, Matches } from 'class-validator';
import { Match } from '../../../common/decorators/match.decorator';

export class ChangePasswordDto {
  @ApiProperty() @IsString() currentPassword: string;
  @ApiProperty({ example: 'NewStrongP@ss123' })
  @IsString() @MinLength(8) @MaxLength(72)
  @Matches(/(?=.*[a-z])/, { message: 'Password must contain at least one lowercase letter' })
  @Matches(/(?=.*[A-Z])/, { message: 'Password must contain at least one uppercase letter' })
  @Matches(/(?=.*\d)/, { message: 'Password must contain at least one number' })
  @Matches(/(?=.*[!@#$%^&*(),.?":{}|<>])/, { message: 'Password must contain at least one special character' })
  newPassword: string;
  @ApiProperty() @IsString() @Match('newPassword', { message: 'Passwords do not match' }) confirmPassword: string;
}
