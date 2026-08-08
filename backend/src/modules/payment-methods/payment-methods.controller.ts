import { Controller, Get, Post, Patch, Delete, Param, Body, Query, UseGuards, ParseUUIDPipe } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { PaymentMethodsService } from './payment-methods.service';
import { CreatePaymentMethodDto } from './dto/create-payment-method.dto';
import { UpdatePaymentMethodDto } from './dto/update-payment-method.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('payment-methods')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('payment-methods')
export class PaymentMethodsController {
  constructor(private readonly paymentMethodsService: PaymentMethodsService) {}

  @Get()
  findAll(@CurrentUser('sub') userId: string, @Query('includeArchived') includeArchived?: string) {
    return this.paymentMethodsService.findAll(userId, includeArchived === 'true');
  }

  @Get(':id')
  findOne(@CurrentUser('sub') userId: string, @Param('id', ParseUUIDPipe) id: string) {
    return this.paymentMethodsService.findOne(userId, id);
  }

  @Post()
  create(@CurrentUser('sub') userId: string, @Body() dto: CreatePaymentMethodDto) {
    return this.paymentMethodsService.create(userId, dto);
  }

  @Patch(':id')
  update(@CurrentUser('sub') userId: string, @Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdatePaymentMethodDto) {
    return this.paymentMethodsService.update(userId, id, dto);
  }

  @Patch(':id/archive')
  archive(@CurrentUser('sub') userId: string, @Param('id', ParseUUIDPipe) id: string) {
    return this.paymentMethodsService.archive(userId, id);
  }

  @Delete(':id')
  remove(@CurrentUser('sub') userId: string, @Param('id', ParseUUIDPipe) id: string) {
    return this.paymentMethodsService.remove(userId, id);
  }
}
