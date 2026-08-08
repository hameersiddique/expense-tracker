import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength, MaxLength, Matches } from 'class-validator';
import { Match } from '../../../common/decorators/match.decorator';

export class RegisterDto {
  @ApiProperty({ example: 'Jane' }) @IsString() @MinLength(1) @MaxLength(100) firstName: string;
  @ApiProperty({ example: 'Doe' }) @IsString() @MinLength(1) @MaxLength(100) lastName: string;
  @ApiProperty({ example: 'jane.doe@example.com' }) @IsEmail() @MaxLength(255) email: string;
  @ApiProperty({ example: 'StrongP@ss123' })
  @IsString() @MinLength(8) @MaxLength(72)
  @Matches(/(?=.*[a-z])/, { message: 'Password must contain at least one lowercase letter' })
  @Matches(/(?=.*[A-Z])/, { message: 'Password must contain at least one uppercase letter' })
  @Matches(/(?=.*\d)/, { message: 'Password must contain at least one number' })
  @Matches(/(?=.*[!@#$%^&*(),.?":{}|<>])/, { message: 'Password must contain at least one special character' })
  password: string;
  @ApiProperty({ example: 'StrongP@ss123' }) @IsString() @Match('password', { message: 'Passwords do not match' }) confirmPassword: string;
}
