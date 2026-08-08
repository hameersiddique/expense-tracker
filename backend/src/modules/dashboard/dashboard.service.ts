import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import dayjs from 'dayjs';
import isBetween from 'dayjs/plugin/isBetween';
import { Transaction, TransactionType } from '../../entities';
import { DashboardQueryDto } from './dto/dashboard-query.dto';

dayjs.extend(isBetween);

@Injectable()
export class DashboardService {
  constructor(@InjectRepository(Transaction) private transactionsRepository: Repository<Transaction>) {}

  async getSummaryCards(userId: string, query: DashboardQueryDto) {
    const all = await this.getTransactionsForUser(userId, query);

    const totalIncome = this.sumByType(all, TransactionType.INCOME);
    const totalExpense = this.sumByType(all, TransactionType.EXPENSE);
    const totalBalance = totalIncome - totalExpense;

    const start = query.dateFrom ? dayjs(query.dateFrom) : (all.length ? dayjs(all.reduce((min, t) => (dayjs(t.date).isBefore(min) ? t.date : min), all[0].date)) : dayjs());
    const end = query.dateTo ? dayjs(query.dateTo) : (all.length ? dayjs(all.reduce((max, t) => (dayjs(t.date).isAfter(max) ? t.date : max), all[0].date)) : dayjs());

    const rangeDays = Math.max(end.diff(start, 'day') + 1, 1);
    const rangeMonths = this.getDistinctMonthCount(all) || 1;

    const expenseTransactions = all.filter((t) => t.type === TransactionType.EXPENSE);
    const incomeTransactions = all.filter((t) => t.type === TransactionType.INCOME);
    const monthlySaving = totalIncome - totalExpense;
    const largestExpense = expenseTransactions.reduce((max, t) => (Number(t.amount) > max ? Number(t.amount) : max), 0);
    const largestIncome = incomeTransactions.reduce((max, t) => (Number(t.amount) > max ? Number(t.amount) : max), 0);

    return {
      totalBalance: this.round(totalBalance),
      totalIncome: this.round(totalIncome),
      totalExpense: this.round(totalExpense),
      monthlySaving: this.round(monthlySaving),
      thisMonthIncome: this.round(totalIncome),
      thisMonthExpense: this.round(totalExpense),
      averageDailyExpense: this.round(totalExpense / rangeDays),
      averageMonthlyExpense: this.round(totalExpense / rangeMonths),
      largestExpense: this.round(largestExpense),
      largestIncome: this.round(largestIncome),
    };
  }

  async getExpensesByCategory(userId: string, query: DashboardQueryDto) {
    const qb = this.transactionsRepository
      .createQueryBuilder('t')
      .leftJoin('t.category', 'category')
      .select('category.name', 'name')
      .addSelect('SUM(t.amount)', 'value')
      .where('t.userId = :userId', { userId })
      .andWhere('t.type = :type', { type: TransactionType.EXPENSE });

    this.applyDateFilter(qb, query);

    const rows = await qb.groupBy('category.name').orderBy('value', 'DESC').getRawMany();
    return rows.map((r) => ({ name: r.name, value: Number(r.value) }));
  }

  async getIncomeByCategory(userId: string, query: DashboardQueryDto) {
    const qb = this.transactionsRepository
      .createQueryBuilder('t')
      .leftJoin('t.category', 'category')
      .select('category.name', 'name')
      .addSelect('SUM(t.amount)', 'value')
      .where('t.userId = :userId', { userId })
      .andWhere('t.type = :type', { type: TransactionType.INCOME });

    this.applyDateFilter(qb, query);

    const rows = await qb.groupBy('category.name').orderBy('value', 'DESC').getRawMany();
    return rows.map((r) => ({ name: r.name, value: Number(r.value) }));
  }

  async getMonthlyIncomeVsExpense(userId: string, query: DashboardQueryDto) {
    const qb = this.transactionsRepository
      .createQueryBuilder('t')
      .select("to_char(t.date, 'YYYY-MM')", 'month')
      .addSelect('t.type', 'type')
      .addSelect('SUM(t.amount)', 'total')
      .where('t.userId = :userId', { userId });

    this.applyDateFilter(qb, query);

    const rows = await qb.groupBy('month').addGroupBy('t.type').orderBy('month', 'ASC').getRawMany();

    const map = new Map<string, { month: string; income: number; expense: number }>();
    rows.forEach((r) => {
      const entry = map.get(r.month) ?? { month: r.month, income: 0, expense: 0 };
      if (r.type === TransactionType.INCOME) entry.income = Number(r.total);
      else entry.expense = Number(r.total);
      map.set(r.month, entry);
    });
    return Array.from(map.values());
  }

  async getBalanceTrend(userId: string, query: DashboardQueryDto) {
    const monthly = await this.getMonthlyIncomeVsExpense(userId, query);
    let runningBalance = 0;
    return monthly.map((m) => {
      runningBalance += m.income - m.expense;
      return { month: m.month, balance: this.round(runningBalance) };
    });
  }

  async getSavingsTrend(userId: string, query: DashboardQueryDto) {
    const monthly = await this.getMonthlyIncomeVsExpense(userId, query);
    return monthly.map((m) => ({ month: m.month, savings: this.round(m.income - m.expense) }));
  }

  async getPaymentMethodBreakdown(userId: string, query: DashboardQueryDto) {
    const qb = this.transactionsRepository
      .createQueryBuilder('t')
      .leftJoin('t.paymentMethod', 'pm')
      .select('pm.name', 'name')
      .addSelect('SUM(t.amount)', 'value')
      .where('t.userId = :userId', { userId })
      .andWhere('pm.id IS NOT NULL');

    this.applyDateFilter(qb, query);

    const rows = await qb.groupBy('pm.name').orderBy('value', 'DESC').getRawMany();
    return rows.map((r) => ({ name: r.name, value: Number(r.value) }));
  }

  async getRecentTransactions(userId: string, query: DashboardQueryDto, limit = 10) {
    const qb = this.transactionsRepository
      .createQueryBuilder('t')
      .leftJoinAndSelect('t.category', 'category')
      .leftJoinAndSelect('t.subcategory', 'subcategory')
      .leftJoinAndSelect('t.paymentMethod', 'paymentMethod')
      .where('t.userId = :userId', { userId });

    this.applyDateFilter(qb, query);

    return qb.orderBy('t.date', 'DESC').addOrderBy('t.createdAt', 'DESC').take(limit).getMany();
  }

  private async getTransactionsForUser(userId: string, query: DashboardQueryDto): Promise<Transaction[]> {
    const qb = this.transactionsRepository.createQueryBuilder('t').where('t.userId = :userId', { userId });
    this.applyDateFilter(qb, query);
    return qb.getMany();
  }

  private applyDateFilter(qb: SelectQueryBuilder<Transaction>, query: DashboardQueryDto) {
    if (query.dateFrom) qb.andWhere('t.date >= :dateFrom', { dateFrom: query.dateFrom });
    if (query.dateTo) qb.andWhere('t.date <= :dateTo', { dateTo: query.dateTo });
    return qb;
  }

  private sumByType(transactions: Transaction[], type: TransactionType): number {
    return transactions.filter((t) => t.type === type).reduce((sum, t) => sum + Number(t.amount), 0);
  }

  private getDistinctMonthCount(transactions: Transaction[]): number {
    const months = new Set(transactions.map((t) => dayjs(t.date).format('YYYY-MM')));
    return months.size;
  }

  private round(value: number): number {
    return Math.round(value * 100) / 100;
  }
}
