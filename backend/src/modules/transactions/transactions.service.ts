import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import dayjs from 'dayjs';
import { parse } from 'csv-parse/sync';
import { Transaction, Category, TransactionType, Subcategory, PaymentMethod, Account, CategoryType, PaymentMethodType } from '../../entities';
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
    @InjectRepository(Subcategory) private subcategoriesRepository: Repository<Subcategory>,
    @InjectRepository(PaymentMethod) private paymentMethodsRepository: Repository<PaymentMethod>,
    @InjectRepository(Account) private accountsRepository: Repository<Account>,
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
    if (query.dateFrom) qb.andWhere('t.date >= :dateFrom', { dateFrom: this.normalizeDateStart(query.dateFrom) });
    if (query.dateTo) qb.andWhere('t.date <= :dateTo', { dateTo: this.normalizeDateEnd(query.dateTo) });
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
    // If a payment method is provided and it's not cash, an account must be selected
    if (dto.paymentMethodId) {
      const pm = await this.paymentMethodsRepository.findOne({ where: { id: dto.paymentMethodId } });
      if (pm && pm.type !== 'cash' && !dto.accountId) {
        throw new BadRequestException('An account must be selected when using a non-cash payment method');
      }
    }
    const transaction = this.transactionsRepository.create({
      userId,
      type: dto.type,
      amount: dto.amount.toFixed(2),
      categoryId: dto.categoryId,
      subcategoryId: dto.subcategoryId ?? null,
      date: this.normalizeTransactionDate(dto.date, dto.time),
      paymentMethodId: dto.paymentMethodId ?? null,
      accountId: dto.accountId ?? null,
      notes: dto.notes ?? null,
    });
    const saved = await this.transactionsRepository.save(transaction);
    return this.findOne(userId, saved.id);
  }

  async update(userId: string, id: string, dto: UpdateTransactionDto): Promise<Transaction> {
    const transaction = await this.findOne(userId, id);
    if (dto.categoryId) await this.validateCategoryOwnership(userId, dto.categoryId, dto.type ?? transaction.type);

    const updatedData = { ...dto } as Partial<Transaction>;
    if (dto.amount !== undefined) updatedData.amount = dto.amount.toFixed(2);
    if (dto.date || dto.time) {
      updatedData.date = this.normalizeTransactionDate(dto.date ?? transaction.date, dto.time, transaction.date);
    }
    delete (updatedData as any).time;

    Object.assign(transaction, updatedData);
    // Enforce account when payment method is non-cash
    if (transaction.paymentMethodId) {
      const pm = await this.paymentMethodsRepository.findOne({ where: { id: transaction.paymentMethodId } });
      if (pm && pm.type !== 'cash' && !transaction.accountId) {
        throw new BadRequestException('An account must be selected when using a non-cash payment method');
      }
    }
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
    if (query.dateFrom) qb.andWhere('t.date >= :dateFrom', { dateFrom: this.normalizeDateStart(query.dateFrom) });
    if (query.dateTo) qb.andWhere('t.date <= :dateTo', { dateTo: this.normalizeDateEnd(query.dateTo) });

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
    const subcategories = await this.subcategoriesRepository.find({ where: { userId } });
    const paymentMethods = await this.paymentMethodsRepository.find({ where: { userId } });

    const categoryByName = new Map(categories.map((c) => [c.name.toLowerCase(), c]));
    const subcategoryByName = new Map(subcategories.map((s) => [s.name.toLowerCase(), s]));
    const paymentMethodByName = new Map(paymentMethods.map((p) => [p.name.toLowerCase(), p]));

    let imported = 0;
    const errors: string[] = [];
    const toInsert: Partial<Transaction>[] = [];

    records.forEach((row, index) => {
      const rowNum = index + 2;
      const type = (row.type || row.Type || '').toLowerCase();
      const amountRaw = row.amount || row.Amount;
      const categoryName = row.category || row.Category;
      const subcategoryName = row.subcategory || row.Subcategory || row['Subcategory'];
      const paymentMethodName = row.paymentMethod || row['Payment Method'] || row['paymentMethod'];
      const date = row.date || row.Date;

      if (!['income', 'expense'].includes(type)) { errors.push(`Row ${rowNum}: invalid type "${row.type || row.Type}"`); return; }
      const amount = parseFloat(amountRaw);
      if (!amount || amount <= 0) { errors.push(`Row ${rowNum}: invalid amount "${amountRaw}"`); return; }
      const category = categoryByName.get((categoryName || '').toLowerCase());
      if (!category) { errors.push(`Row ${rowNum}: unknown category "${categoryName}"`); return; }
      if (!date || !dayjs(date).isValid()) { errors.push(`Row ${rowNum}: invalid date "${date}"`); return; }

      const subcategory = subcategoryName ? subcategoryByName.get(subcategoryName.toLowerCase()) : undefined;
      const paymentMethod = paymentMethodName ? paymentMethodByName.get(paymentMethodName.toLowerCase()) : undefined;

      toInsert.push({
        userId,
        type: type as TransactionType,
        amount: amount.toFixed(2),
        categoryId: category.id,
        subcategoryId: subcategory?.id ?? null,
        paymentMethodId: paymentMethod?.id ?? null,
        date: dayjs(date).format('YYYY-MM-DD'),
        notes: row.notes || row.Notes || null,
      });
    });

    if (toInsert.length > 0) {
      const entities = toInsert.map((t) => this.transactionsRepository.create(t));
      await this.transactionsRepository.save(entities);
      imported = entities.length;
    }

    return { imported, failed: errors.length, errors };
  }

  async createTransfer(userId: string, dto: { fromAccountId?: string | null; toAccountId?: string | null; amount: number; date?: string; notes?: string }) {
    const { fromAccountId = null, toAccountId = null, amount, date, notes } = dto;
    if (!amount || amount <= 0) throw new BadRequestException('Invalid transfer amount');
    if (fromAccountId === toAccountId) throw new BadRequestException('Source and destination accounts must differ');
    if (!fromAccountId && !toAccountId) throw new BadRequestException('Source or destination must be specified');

    let cashMethod = await this.paymentMethodsRepository.findOne({ where: { userId, type: PaymentMethodType.CASH } });
    if (!cashMethod) {
      cashMethod = this.paymentMethodsRepository.create({ userId, type: PaymentMethodType.CASH, name: 'Cash', isDefault: true });
      cashMethod = await this.paymentMethodsRepository.save(cashMethod);
    }

    const dateStr = date && dayjs(date).isValid() ? dayjs(date).format('YYYY-MM-DD') : dayjs().format('YYYY-MM-DD');

    const transferExpenseCategory = await this.ensureTransferCategory(userId, CategoryType.EXPENSE);
    const transferIncomeCategory = await this.ensureTransferCategory(userId, CategoryType.INCOME);

    const tasks: Transaction[] = [];

    if (!fromAccountId || !toAccountId) {
      const isIncome = !fromAccountId && !!toAccountId;
      const accountId = toAccountId ?? fromAccountId;
      const category = isIncome ? transferIncomeCategory : transferExpenseCategory;
      const transaction = this.transactionsRepository.create({
        userId,
        type: isIncome ? TransactionType.INCOME : TransactionType.EXPENSE,
        amount: amount.toFixed(2),
        categoryId: category.id,
        subcategoryId: null,
        date: dateStr,
        paymentMethodId: cashMethod.id,
        accountId,
        notes: notes ?? null,
      });
      tasks.push(transaction);
    } else {
      const from = await this.accountsRepository.findOne({ where: { id: fromAccountId } });
      const to = await this.accountsRepository.findOne({ where: { id: toAccountId } });
      if (!from || from.userId !== userId) throw new NotFoundException('Source account not found');
      if (!to || to.userId !== userId) throw new NotFoundException('Destination account not found');

      const expenseTx = this.transactionsRepository.create({
        userId,
        type: TransactionType.EXPENSE,
        amount: amount.toFixed(2),
        categoryId: transferExpenseCategory.id,
        subcategoryId: null,
        date: dateStr,
        paymentMethodId: null,
        accountId: fromAccountId,
        notes: notes ?? null,
      });

      const incomeTx = this.transactionsRepository.create({
        userId,
        type: TransactionType.INCOME,
        amount: amount.toFixed(2),
        categoryId: transferIncomeCategory.id,
        subcategoryId: null,
        date: dateStr,
        paymentMethodId: null,
        accountId: toAccountId,
        notes: notes ?? null,
      });
      tasks.push(expenseTx, incomeTx);
    }

    const saved = await this.transactionsRepository.save(tasks);
    return { transferred: saved.length };
  }

  private async ensureTransferCategory(userId: string, type: CategoryType) {
    const name = 'Transfer';
    const categoryRepo = this.categoriesRepository;
    const existing = await categoryRepo.findOne({ where: { userId, name, type } });
    if (existing) return existing;
    const created = categoryRepo.create({ userId, name, type, isDefault: false });
    return categoryRepo.save(created);
  }

  private normalizeTransactionDate(dateValue: string, timeValue?: string, originalDate?: string): string {
    const baseDate = dayjs(dateValue || originalDate);
    if (!baseDate.isValid()) return dateValue;
    if (timeValue) {
      return dayjs(`${baseDate.format('YYYY-MM-DD')}T${timeValue}:00`).toISOString();
    }
    if (dateValue && !originalDate) {
      return baseDate.startOf('day').toISOString();
    }
    return originalDate ?? baseDate.startOf('day').toISOString();
  }

  private normalizeDateStart(value: string): string {
    const parsed = dayjs(value);
    if (!parsed.isValid()) return value;
    return parsed.startOf('day').toISOString();
  }

  private normalizeDateEnd(value: string): string {
    const parsed = dayjs(value);
    if (!parsed.isValid()) return value;
    return parsed.endOf('day').toISOString();
  }

  private async validateCategoryOwnership(userId: string, categoryId: string, type: TransactionType): Promise<void> {
    const category = await this.categoriesRepository.findOne({ where: { id: categoryId } });
    if (!category || category.userId !== userId) throw new NotFoundException('Category not found');
    if ((category.type as string) !== (type as string)) {
      throw new BadRequestException(`Category "${category.name}" is a ${category.type} category and cannot be used for a ${type} transaction`);
    }
  }
}
