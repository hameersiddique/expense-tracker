import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import dayjs from 'dayjs';
import isBetween from 'dayjs/plugin/isBetween';
import { Transaction, TransactionType } from '../../entities';
import { DashboardQueryDto } from './dto/dashboard-query.dto';

dayjs.extend(isBetween);

@Injectable()
export class DashboardService {
  constructor(@InjectRepository(Transaction) private transactionsRepository: Repository<Transaction>) {}

  async getSummaryCards(userId: string, query: DashboardQueryDto) {
    const all = await this.transactionsRepository.find({ where: { userId } });

    const totalIncome = this.sumByType(all, TransactionType.INCOME);
    const totalExpense = this.sumByType(all, TransactionType.EXPENSE);
    const totalBalance = totalIncome - totalExpense;

    const startOfMonth = dayjs().startOf('month');
    const endOfMonth = dayjs().endOf('month');
    const thisMonth = all.filter((t) => dayjs(t.date).isBetween(startOfMonth, endOfMonth, 'day', '[]'));
    const thisMonthIncome = this.sumByType(thisMonth, TransactionType.INCOME);
    const thisMonthExpense = this.sumByType(thisMonth, TransactionType.EXPENSE);
    const monthlySaving = thisMonthIncome - thisMonthExpense;

    const expenseTransactions = all.filter((t) => t.type === TransactionType.EXPENSE);
    const incomeTransactions = all.filter((t) => t.type === TransactionType.INCOME);

    const daysElapsedThisMonth = dayjs().date();
    const avgDailyExpense = daysElapsedThisMonth > 0 ? thisMonthExpense / daysElapsedThisMonth : 0;

    const monthsSpan = this.getDistinctMonthCount(all) || 1;
    const avgMonthlyExpense = totalExpense / monthsSpan;

    const largestExpense = expenseTransactions.reduce((max, t) => (Number(t.amount) > max ? Number(t.amount) : max), 0);
    const largestIncome = incomeTransactions.reduce((max, t) => (Number(t.amount) > max ? Number(t.amount) : max), 0);

    return {
      totalBalance: this.round(totalBalance),
      totalIncome: this.round(totalIncome),
      totalExpense: this.round(totalExpense),
      monthlySaving: this.round(monthlySaving),
      thisMonthIncome: this.round(thisMonthIncome),
      thisMonthExpense: this.round(thisMonthExpense),
      averageDailyExpense: this.round(avgDailyExpense),
      averageMonthlyExpense: this.round(avgMonthlyExpense),
      largestExpense: this.round(largestExpense),
      largestIncome: this.round(largestIncome),
    };
  }

  async getExpensesByCategory(userId: string) {
    const rows = await this.transactionsRepository
      .createQueryBuilder('t')
      .leftJoin('t.category', 'category')
      .select('category.name', 'name')
      .addSelect('SUM(t.amount)', 'value')
      .where('t.userId = :userId', { userId })
      .andWhere('t.type = :type', { type: TransactionType.EXPENSE })
      .groupBy('category.name')
      .orderBy('value', 'DESC')
      .getRawMany();
    return rows.map((r) => ({ name: r.name, value: Number(r.value) }));
  }

  async getIncomeByCategory(userId: string) {
    const rows = await this.transactionsRepository
      .createQueryBuilder('t')
      .leftJoin('t.category', 'category')
      .select('category.name', 'name')
      .addSelect('SUM(t.amount)', 'value')
      .where('t.userId = :userId', { userId })
      .andWhere('t.type = :type', { type: TransactionType.INCOME })
      .groupBy('category.name')
      .orderBy('value', 'DESC')
      .getRawMany();
    return rows.map((r) => ({ name: r.name, value: Number(r.value) }));
  }

  async getMonthlyIncomeVsExpense(userId: string) {
    const rows = await this.transactionsRepository
      .createQueryBuilder('t')
      .select("to_char(t.date, 'YYYY-MM')", 'month')
      .addSelect('t.type', 'type')
      .addSelect('SUM(t.amount)', 'total')
      .where('t.userId = :userId', { userId })
      .groupBy('month')
      .addGroupBy('t.type')
      .orderBy('month', 'ASC')
      .getRawMany();

    const map = new Map<string, { month: string; income: number; expense: number }>();
    rows.forEach((r) => {
      const entry = map.get(r.month) ?? { month: r.month, income: 0, expense: 0 };
      if (r.type === TransactionType.INCOME) entry.income = Number(r.total);
      else entry.expense = Number(r.total);
      map.set(r.month, entry);
    });
    return Array.from(map.values());
  }

  async getBalanceTrend(userId: string) {
    const monthly = await this.getMonthlyIncomeVsExpense(userId);
    let runningBalance = 0;
    return monthly.map((m) => {
      runningBalance += m.income - m.expense;
      return { month: m.month, balance: this.round(runningBalance) };
    });
  }

  async getSavingsTrend(userId: string) {
    const monthly = await this.getMonthlyIncomeVsExpense(userId);
    return monthly.map((m) => ({ month: m.month, savings: this.round(m.income - m.expense) }));
  }

  async getPaymentMethodBreakdown(userId: string) {
    const rows = await this.transactionsRepository
      .createQueryBuilder('t')
      .leftJoin('t.paymentMethod', 'pm')
      .select('pm.name', 'name')
      .addSelect('SUM(t.amount)', 'value')
      .where('t.userId = :userId', { userId })
      .andWhere('pm.id IS NOT NULL')
      .groupBy('pm.name')
      .orderBy('value', 'DESC')
      .getRawMany();
    return rows.map((r) => ({ name: r.name, value: Number(r.value) }));
  }

  async getRecentTransactions(userId: string, limit = 10) {
    return this.transactionsRepository.find({
      where: { userId },
      relations: ['category', 'subcategory', 'paymentMethod'],
      order: { date: 'DESC', createdAt: 'DESC' },
      take: limit,
    });
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
