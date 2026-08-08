import { Controller, Get, Patch, Body, Delete, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UpdateSettingsDto } from './dto/update-settings.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @ApiOperation({ summary: 'Get the current user record' })
  async getMe(@CurrentUser('sub') userId: string) {
    const u = await this.usersService.findById(userId);
    const { passwordHash, passwordResetToken, emailVerificationToken, ...rest } = u;
    void passwordHash; void passwordResetToken; void emailVerificationToken;
    return rest;
  }

  @Patch('me/profile')
  @ApiOperation({ summary: 'Update first/last name or email' })
  updateProfile(@CurrentUser('sub') userId: string, @Body() dto: UpdateProfileDto) {
    return this.usersService.updateProfile(userId, dto);
  }

  @Patch('me/settings')
  @ApiOperation({ summary: 'Update currency, language, timezone, theme' })
  updateSettings(@CurrentUser('sub') userId: string, @Body() dto: UpdateSettingsDto) {
    return this.usersService.updateSettings(userId, dto);
  }

  @Delete('me')
  @ApiOperation({ summary: 'Deactivate the current account' })
  deactivate(@CurrentUser('sub') userId: string) { return this.usersService.deactivate(userId); }
}
