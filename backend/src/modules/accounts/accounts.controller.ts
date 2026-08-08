import { Controller, Get, Post, Patch, Delete, Param, Body, Query, UseGuards, ParseUUIDPipe } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AccountsService } from './accounts.service';
import { CreateAccountDto } from './dto/create-account.dto';
import { UpdateAccountDto } from './dto/update-account.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('accounts')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('accounts')
export class AccountsController {
  constructor(private readonly accountsService: AccountsService) {}

  @Get()
  findAll(@CurrentUser('sub') userId: string, @Query('includeArchived') includeArchived?: string) {
    return this.accountsService.findAll(userId, includeArchived === 'true');
  }

  @Get(':id')
  findOne(@CurrentUser('sub') userId: string, @Param('id', ParseUUIDPipe) id: string) {
    return this.accountsService.findOne(userId, id);
  }

  @Post()
  @ApiOperation({ summary: 'Create an account (bank, wallet, cash, etc.)' })
  create(@CurrentUser('sub') userId: string, @Body() dto: CreateAccountDto) {
    return this.accountsService.create(userId, dto);
  }

  @Patch(':id')
  update(@CurrentUser('sub') userId: string, @Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateAccountDto) {
    return this.accountsService.update(userId, id, dto);
  }

  @Patch(':id/archive')
  archive(@CurrentUser('sub') userId: string, @Param('id', ParseUUIDPipe) id: string) {
    return this.accountsService.archive(userId, id);
  }

  @Delete(':id')
  remove(@CurrentUser('sub') userId: string, @Param('id', ParseUUIDPipe) id: string) {
    return this.accountsService.remove(userId, id);
  }
}
