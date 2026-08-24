import {
  Controller, Get, Post, Patch, Delete, Param, Body, Query, Res, UseGuards, UseInterceptors,
  UploadedFile, ParseUUIDPipe, BadRequestException, Logger,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiConsumes } from '@nestjs/swagger';
import type { Response } from 'express';
import { TransactionsService } from './transactions.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { QueryTransactionDto } from './dto/query-transaction.dto';
import { BulkDeleteDto } from './dto/bulk-delete.dto';
import { BulkUpdateDto } from './dto/bulk-update.dto';
import { ExportQueryDto } from './dto/export-query.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('transactions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('transactions')
export class TransactionsController {
  private readonly logger = new Logger(TransactionsController.name);
  constructor(private readonly transactionsService: TransactionsService) {}

  @Get()
  @ApiOperation({ summary: 'List transactions with pagination, filtering, sorting, and search' })
  findAll(@CurrentUser('sub') userId: string, @Query() query: QueryTransactionDto) {
    return this.transactionsService.findAll(userId, query);
  }

  @Get('export')
  @ApiOperation({ summary: 'Export transactions as CSV, Excel, or PDF' })
  async export(@CurrentUser('sub') userId: string, @Query() query: ExportQueryDto, @Res() res: Response) {
    const { buffer, filename, contentType } = await this.transactionsService.exportTransactions(userId, query);
    res.set({ 'Content-Type': contentType, 'Content-Disposition': `attachment; filename="${filename}"` });
    res.send(buffer);
  }

  @Post('import')
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Bulk import transactions from a CSV file' })
  @UseInterceptors(FileInterceptor('file'))
  importCsv(@CurrentUser('sub') userId: string, @UploadedFile() file?: Express.Multer.File) {
    if (!file) throw new BadRequestException('No file uploaded');
    return this.transactionsService.importCsv(userId, file.buffer);
  }

  @Post('transfer')
  @ApiOperation({ summary: 'Transfer funds between cash and accounts' })
  transfer(@CurrentUser('sub') userId: string, @Body() body: { fromAccountId?: string | null; toAccountId?: string | null; amount: number; date?: string; notes?: string; external?: boolean }) {
    return this.transactionsService.createTransfer(userId, body);
  }

  @Get(':id')
  findOne(@CurrentUser('sub') userId: string, @Param('id', ParseUUIDPipe) id: string) {
    return this.transactionsService.findOne(userId, id);
  }

  @Post()
  create(@CurrentUser('sub') userId: string, @Body() dto: CreateTransactionDto) {
    return this.transactionsService.create(userId, dto);
  }

  @Post(':id/duplicate')
  duplicate(@CurrentUser('sub') userId: string, @Param('id', ParseUUIDPipe) id: string) {
    return this.transactionsService.duplicate(userId, id);
  }

  @Patch('bulk')
  bulkUpdate(@CurrentUser('sub') userId: string, @Body() dto: BulkUpdateDto) {
    return this.transactionsService.bulkUpdate(userId, dto);
  }

  @Delete('bulk')
  bulkDelete(@CurrentUser('sub') userId: string, @Body() dto: BulkDeleteDto) {
    return this.transactionsService.bulkDelete(userId, dto);
  }

  @Patch(':id')
  update(@CurrentUser('sub') userId: string, @Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateTransactionDto) {
    this.logger.debug(`PATCH /transactions/${id} by user ${userId} payload: ${JSON.stringify(dto)}`);
    return this.transactionsService.update(userId, id, dto);
  }

  @Delete(':id')
  remove(@CurrentUser('sub') userId: string, @Param('id', ParseUUIDPipe) id: string) {
    return this.transactionsService.remove(userId, id);
  }
}
