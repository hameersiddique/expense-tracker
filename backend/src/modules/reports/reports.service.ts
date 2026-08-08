import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import dayjs from 'dayjs';
import quarterOfYear from 'dayjs/plugin/quarterOfYear';
import { Transaction, TransactionType } from '../../entities';
import { ReportQueryDto, ReportPeriod, ReportFormat } from './dto/report-query.dto';
import { ExportService, ExportColumn } from '../../common/services/export.service';

dayjs.extend(quarterOfYear);

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(Transaction) private transactionsRepository: Repository<Transaction>,
    private exportService: ExportService,
  ) {}

  async generate(userId: string, query: ReportQueryDto): Promise<{ buffer: Buffer; filename: string; contentType: string }> {
    const { dateFrom, dateTo } = this.resolveDateRange(query);

    const transactions = await this.transactionsRepository
      .createQueryBuilder('t')
      .leftJoinAndSelect('t.category', 'category')
      .leftJoinAndSelect('t.subcategory', 'subcategory')
      .where('t.userId = :userId', { userId })
      .andWhere('t.date >= :dateFrom', { dateFrom })
      .andWhere('t.date <= :dateTo', { dateTo })
      .orderBy('t.date', 'ASC')
      .getMany();

    const totalIncome = transactions.filter((t) => t.type === TransactionType.INCOME).reduce((s, t) => s + Number(t.amount), 0);
    const totalExpense = transactions.filter((t) => t.type === TransactionType.EXPENSE).reduce((s, t) => s + Number(t.amount), 0);

    const columns: ExportColumn[] = [
      { header: 'Date', key: 'date', width: 14 }, { header: 'Type', key: 'type', width: 12 },
      { header: 'Category', key: 'category', width: 18 }, { header: 'Subcategory', key: 'subcategory', width: 18 },
      { header: 'Amount', key: 'amount', width: 14 }, { header: 'Notes', key: 'notes', width: 30 },
    ];
    const rows = transactions.map((t) => ({
      date: t.date, type: t.type, category: t.category?.name ?? '', subcategory: t.subcategory?.name ?? '',
      amount: t.amount, notes: t.notes ?? '',
    }));
    rows.push({ date: '', type: '', category: '', subcategory: '', amount: '', notes: '' } as any);
    rows.push({ date: 'TOTAL INCOME', type: '', category: '', subcategory: '', amount: totalIncome.toFixed(2), notes: '' } as any);
    rows.push({ date: 'TOTAL EXPENSE', type: '', category: '', subcategory: '', amount: totalExpense.toFixed(2), notes: '' } as any);
    rows.push({ date: 'NET', type: '', category: '', subcategory: '', amount: (totalIncome - totalExpense).toFixed(2), notes: '' } as any);

    const filenameBase = `report-${query.period}-${dateFrom}-to-${dateTo}`;
    const title = `Expense Report (${query.period}): ${dateFrom} to ${dateTo}`;

    if (query.format === ReportFormat.EXCEL) {
      const buffer = await this.exportService.toExcel(columns, rows, 'Report');
      return { buffer, filename: `${filenameBase}.xlsx`, contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' };
    }
    if (query.format === ReportFormat.CSV) {
      const buffer = this.exportService.toCsv(columns, rows);
      return { buffer, filename: `${filenameBase}.csv`, contentType: 'text/csv' };
    }
    const buffer = await this.exportService.toPdf(title, columns, rows);
    return { buffer, filename: `${filenameBase}.pdf`, contentType: 'application/pdf' };
  }

  private resolveDateRange(query: ReportQueryDto): { dateFrom: string; dateTo: string } {
    const now = dayjs();
    switch (query.period) {
      case ReportPeriod.DAILY:
        return { dateFrom: now.format('YYYY-MM-DD'), dateTo: now.format('YYYY-MM-DD') };
      case ReportPeriod.WEEKLY:
        return { dateFrom: now.startOf('week').format('YYYY-MM-DD'), dateTo: now.endOf('week').format('YYYY-MM-DD') };
      case ReportPeriod.MONTHLY:
        return { dateFrom: now.startOf('month').format('YYYY-MM-DD'), dateTo: now.endOf('month').format('YYYY-MM-DD') };
      case ReportPeriod.QUARTERLY:
        return { dateFrom: now.startOf('quarter').format('YYYY-MM-DD'), dateTo: now.endOf('quarter').format('YYYY-MM-DD') };
      case ReportPeriod.YEARLY:
        return { dateFrom: now.startOf('year').format('YYYY-MM-DD'), dateTo: now.endOf('year').format('YYYY-MM-DD') };
      case ReportPeriod.CUSTOM:
        if (!query.dateFrom || !query.dateTo) throw new BadRequestException('dateFrom and dateTo are required for custom reports');
        return { dateFrom: query.dateFrom, dateTo: query.dateTo };
      default:
        throw new BadRequestException('Invalid report period');
    }
  }
}
