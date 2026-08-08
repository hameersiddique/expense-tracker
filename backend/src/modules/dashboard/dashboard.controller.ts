import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';
import { DashboardQueryDto } from './dto/dashboard-query.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('dashboard')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('summary')
  @ApiOperation({ summary: 'Get dashboard summary cards' })
  getSummary(@CurrentUser('sub') userId: string, @Query() query: DashboardQueryDto) {
    return this.dashboardService.getSummaryCards(userId, query);
  }

  @Get('charts/expenses-by-category')
  getExpensesByCategory(@CurrentUser('sub') userId: string, @Query() query: DashboardQueryDto) {
    return this.dashboardService.getExpensesByCategory(userId, query);
  }

  @Get('charts/income-by-category')
  getIncomeByCategory(@CurrentUser('sub') userId: string, @Query() query: DashboardQueryDto) {
    return this.dashboardService.getIncomeByCategory(userId, query);
  }

  @Get('charts/monthly-income-vs-expense')
  getMonthlyIncomeVsExpense(@CurrentUser('sub') userId: string, @Query() query: DashboardQueryDto) {
    return this.dashboardService.getMonthlyIncomeVsExpense(userId, query);
  }

  @Get('charts/balance-trend')
  getBalanceTrend(@CurrentUser('sub') userId: string, @Query() query: DashboardQueryDto) {
    return this.dashboardService.getBalanceTrend(userId, query);
  }

  @Get('charts/savings-trend')
  getSavingsTrend(@CurrentUser('sub') userId: string, @Query() query: DashboardQueryDto) {
    return this.dashboardService.getSavingsTrend(userId, query);
  }

  @Get('charts/payment-methods')
  getPaymentMethodBreakdown(@CurrentUser('sub') userId: string, @Query() query: DashboardQueryDto) {
    return this.dashboardService.getPaymentMethodBreakdown(userId, query);
  }

  @Get('recent-transactions')
  getRecentTransactions(@CurrentUser('sub') userId: string, @Query() query: DashboardQueryDto) {
    return this.dashboardService.getRecentTransactions(userId, query);
  }

  @Get('balances')
  @ApiOperation({ summary: 'Get all-time cash and account balances' })
  getBalances(@CurrentUser('sub') userId: string) {
    return this.dashboardService.getAllTimeBalances(userId);
  }
}
