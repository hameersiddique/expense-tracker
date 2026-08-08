import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import dayjs from 'dayjs';
import { parse } from 'csv-parse/sync';
import { Transaction, Category, TransactionType } from '../../entities';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { QueryTransactionDto } from './dto/query-transaction.dto';
import { BulkDeleteDto } from './dto/bulk-delete.dto';
import { BulkUpdateDto } from './dto/bulk-update.dto';
import { ExportQueryDto, ExportFormat } from './dto/export-query.dto';
import { PaginatedResult, buildPaginatedResult } from '../../common/dto/pagination-query.dto';
import { ExportService, ExportColumn } from '../../common/services/export.service';

const TRANSACTION_RELATIONS = ['category', 'subcategory', 'paymentMethod', 'account'];

@Injectable()
export class TransactionsService {
  constructor(
    @InjectRepository(Transaction) private transactionsRepository: Repository<Transaction>,
    @InjectRepository(Category) private categoriesRepository: Repository<Category>,
    private exportService: ExportService,
  ) {}

  async findAll(userId: string, query: QueryTransactionDto): Promise<PaginatedResult<Transaction>> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const qb = this.transactionsRepository
      .createQueryBuilder('t')
      .leftJoinAndSelect('t.category', 'category')
      .leftJoinAndSelect('t.subcategory', 'subcategory')
      .leftJoinAndSelect('t.paymentMethod', 'paymentMethod')
      .leftJoinAndSelect('t.account', 'account')
      .where('t.userId = :userId', { userId });

    if (query.type) qb.andWhere('t.type = :type', { type: query.type });
    if (query.categoryId) qb.andWhere('t.categoryId = :categoryId', { categoryId: query.categoryId });
    if (query.subcategoryId) qb.andWhere('t.subcategoryId = :subcategoryId', { subcategoryId: query.subcategoryId });
    if (query.paymentMethodId) qb.andWhere('t.paymentMethodId = :paymentMethodId', { paymentMethodId: query.paymentMethodId });
    if (query.accountId) qb.andWhere('t.accountId = :accountId', { accountId: query.accountId });
    if (query.dateFrom) qb.andWhere('t.date >= :dateFrom', { dateFrom: query.dateFrom });
    if (query.dateTo) qb.andWhere('t.date <= :dateTo', { dateTo: query.dateTo });
    if (query.amountMin !== undefined) qb.andWhere('t.amount >= :amountMin', { amountMin: query.amountMin });
    if (query.amountMax !== undefined) qb.andWhere('t.amount <= :amountMax', { amountMax: query.amountMax });
    if (query.search) {
      qb.andWhere('(t.notes ILIKE :search OR category.name ILIKE :search OR subcategory.name ILIKE :search)', { search: `%${query.search}%` });
    }

    const sortableFields = new Map<string, string>([
      ['date', 't.date'], ['amount', 't.amount'], ['type', 't.type'], ['createdAt', 't.createdAt'],
    ]);
    const sortColumn = sortableFields.get(query.sortBy ?? 'date') ?? 't.date';
    qb.orderBy(sortColumn, query.sortOrder ?? 'DESC').addOrderBy('t.createdAt', 'DESC');
    qb.skip((page - 1) * limit).take(limit);

    const [items, totalItems] = await qb.getManyAndCount();
    return buildPaginatedResult(items, totalItems, page, limit);
  }

  async findOne(userId: string, id: string): Promise<Transaction> {
    const transaction = await this.transactionsRepository.findOne({ where: { id }, relations: TRANSACTION_RELATIONS });
    if (!transaction) throw new NotFoundException('Transaction not found');
    if (transaction.userId !== userId) throw new ForbiddenException('Access denied');
    return transaction;
  }

  async create(userId: string, dto: CreateTransactionDto): Promise<Transaction> {
    await this.validateCategoryOwnership(userId, dto.categoryId, dto.type);
    const transaction = this.transactionsRepository.create({
      userId, type: dto.type, amount: dto.amount.toFixed(2), categoryId: dto.categoryId,
      subcategoryId: dto.subcategoryId ?? null, date: dto.date, paymentMethodId: dto.paymentMethodId ?? null,
      accountId: dto.accountId ?? null, notes: dto.notes ?? null,
    });
    const saved = await this.transactionsRepository.save(transaction);
    return this.findOne(userId, saved.id);
  }

  async update(userId: string, id: string, dto: UpdateTransactionDto): Promise<Transaction> {
    const transaction = await this.findOne(userId, id);
    if (dto.categoryId) await this.validateCategoryOwnership(userId, dto.categoryId, dto.type ?? transaction.type);
    Object.assign(transaction, { ...dto, amount: dto.amount !== undefined ? dto.amount.toFixed(2) : transaction.amount });
    await this.transactionsRepository.save(transaction);
    return this.findOne(userId, id);
  }

  async remove(userId: string, id: string): Promise<{ message: string }> {
    const transaction = await this.findOne(userId, id);
    await this.transactionsRepository.softDelete(transaction.id);
    return { message: 'Transaction deleted' };
  }

  async duplicate(userId: string, id: string): Promise<Transaction> {
    const original = await this.findOne(userId, id);
    const copy = this.transactionsRepository.create({
      userId, type: original.type, amount: original.amount, categoryId: original.categoryId,
      subcategoryId: original.subcategoryId, date: dayjs().format('YYYY-MM-DD'),
      paymentMethodId: original.paymentMethodId, accountId: original.accountId, notes: original.notes,
    });
    const saved = await this.transactionsRepository.save(copy);
    return this.findOne(userId, saved.id);
  }

  async bulkDelete(userId: string, dto: BulkDeleteDto): Promise<{ deleted: number }> {
    const owned = await this.transactionsRepository.find({ where: { id: In(dto.ids), userId }, select: ['id'] });
    if (owned.length !== dto.ids.length) throw new ForbiddenException('One or more transactions do not belong to you');
    const result = await this.transactionsRepository.softDelete({ id: In(dto.ids), userId });
    return { deleted: result.affected ?? 0 };
  }

  async bulkUpdate(userId: string, dto: BulkUpdateDto): Promise<{ updated: number }> {
    const { ids, ...fields } = dto;
    const transactions = await this.transactionsRepository.find({ where: { userId } });
    const targetIds = new Set(ids);
    const toUpdate = transactions.filter((t) => targetIds.has(t.id));
    if (toUpdate.length !== ids.length) throw new ForbiddenException('One or more transactions do not belong to you');
    for (const t of toUpdate) Object.assign(t, fields);
    await this.transactionsRepository.save(toUpdate);
    return { updated: toUpdate.length };
  }

  async exportTransactions(userId: string, query: ExportQueryDto): Promise<{ buffer: Buffer; filename: string; contentType: string }> {
    const qb = this.transactionsRepository
      .createQueryBuilder('t')
      .leftJoinAndSelect('t.category', 'category')
      .leftJoinAndSelect('t.subcategory', 'subcategory')
      .leftJoinAndSelect('t.paymentMethod', 'paymentMethod')
      .leftJoinAndSelect('t.account', 'account')
      .where('t.userId = :userId', { userId })
      .orderBy('t.date', 'DESC');

    if (query.type) qb.andWhere('t.type = :type', { type: query.type });
    if (query.categoryId) qb.andWhere('t.categoryId = :categoryId', { categoryId: query.categoryId });
    if (query.dateFrom) qb.andWhere('t.date >= :dateFrom', { dateFrom: query.dateFrom });
    if (query.dateTo) qb.andWhere('t.date <= :dateTo', { dateTo: query.dateTo });

    const transactions = await qb.getMany();
    const columns: ExportColumn[] = [
      { header: 'Date', key: 'date', width: 14 }, { header: 'Type', key: 'type', width: 12 },
      { header: 'Amount', key: 'amount', width: 14 }, { header: 'Category', key: 'category', width: 18 },
      { header: 'Subcategory', key: 'subcategory', width: 18 }, { header: 'Payment Method', key: 'paymentMethod', width: 18 },
      { header: 'Account', key: 'account', width: 16 }, { header: 'Notes', key: 'notes', width: 30 },
    ];
    const rows = transactions.map((t) => ({
      date: t.date, type: t.type, amount: t.amount, category: t.category?.name ?? '',
      subcategory: t.subcategory?.name ?? '', paymentMethod: t.paymentMethod?.name ?? '',
      account: t.account?.name ?? '', notes: t.notes ?? '',
    }));

    const timestamp = dayjs().format('YYYY-MM-DD');
    const format = query.format ?? ExportFormat.CSV;

    if (format === ExportFormat.EXCEL) {
      const buffer = await this.exportService.toExcel(columns, rows, 'Transactions');
      return { buffer, filename: `transactions-${timestamp}.xlsx`, contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' };
    }
    if (format === ExportFormat.PDF) {
      const buffer = await this.exportService.toPdf('Transactions Export', columns, rows);
      return { buffer, filename: `transactions-${timestamp}.pdf`, contentType: 'application/pdf' };
    }
    const buffer = this.exportService.toCsv(columns, rows);
    return { buffer, filename: `transactions-${timestamp}.csv`, contentType: 'text/csv' };
  }

  async importCsv(userId: string, fileBuffer: Buffer): Promise<{ imported: number; failed: number; errors: string[] }> {
    const records: Record<string, string>[] = parse(fileBuffer, { columns: true, skip_empty_lines: true, trim: true });
    const categories = await this.categoriesRepository.find({ where: { userId } });
    const categoryByName = new Map(categories.map((c) => [c.name.toLowerCase(), c]));

    let imported = 0;
    const errors: string[] = [];
    const toInsert: Partial<Transaction>[] = [];

    records.forEach((row, index) => {
      const rowNum = index + 2;
      const type = (row.type || row.Type || '').toLowerCase();
      const amountRaw = row.amount || row.Amount;
      const categoryName = row.category || row.Category;
      const date = row.date || row.Date;

      if (!['income', 'expense'].includes(type)) { errors.push(`Row ${rowNum}: invalid type "${row.type}"`); return; }
      const amount = parseFloat(amountRaw);
      if (!amount || amount <= 0) { errors.push(`Row ${rowNum}: invalid amount "${amountRaw}"`); return; }
      const category = categoryByName.get((categoryName || '').toLowerCase());
      if (!category) { errors.push(`Row ${rowNum}: unknown category "${categoryName}"`); return; }
      if (!date || !dayjs(date).isValid()) { errors.push(`Row ${rowNum}: invalid date "${date}"`); return; }

      toInsert.push({
        userId, type: type as TransactionType, amount: amount.toFixed(2), categoryId: category.id,
        date: dayjs(date).format('YYYY-MM-DD'), notes: row.notes || row.Notes || null,
      });
    });

    if (toInsert.length > 0) {
      const entities = toInsert.map((t) => this.transactionsRepository.create(t));
      await this.transactionsRepository.save(entities);
      imported = entities.length;
    }

    return { imported, failed: errors.length, errors };
  }

  private async validateCategoryOwnership(userId: string, categoryId: string, type: TransactionType): Promise<void> {
    const category = await this.categoriesRepository.findOne({ where: { id: categoryId } });
    if (!category || category.userId !== userId) throw new NotFoundException('Category not found');
    if ((category.type as string) !== (type as string)) {
      throw new BadRequestException(`Category "${category.name}" is a ${category.type} category and cannot be used for a ${type} transaction`);
    }
  }
}
