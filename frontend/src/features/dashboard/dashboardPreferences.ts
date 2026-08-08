export type DashboardWidgetKey =
  | 'expensesByCategory'
  | 'incomeByCategory'
  | 'monthly'
  | 'netCashFlow'
  | 'balanceTrend'
  | 'savingsTrend'
  | 'paymentMethods'
  | 'topExpenseCategories';

export const DEFAULT_DASHBOARD_WIDGET_STATE: Record<DashboardWidgetKey, boolean> = {
  expensesByCategory: true,
  incomeByCategory: true,
  monthly: true,
  netCashFlow: true,
  balanceTrend: true,
  savingsTrend: true,
  paymentMethods: true,
  topExpenseCategories: true,
};

export const DASHBOARD_WIDGETS: Array<{ key: DashboardWidgetKey; label: string }> = [
  { key: 'expensesByCategory', label: 'Expenses by Category' },
  { key: 'incomeByCategory', label: 'Income by Category' },
  { key: 'monthly', label: 'Monthly Income vs Expense' },
  { key: 'netCashFlow', label: 'Monthly Net Cash Flow' },
  { key: 'balanceTrend', label: 'Balance Trend' },
  { key: 'savingsTrend', label: 'Savings Trend' },
  { key: 'paymentMethods', label: 'Payment Methods' },
  { key: 'topExpenseCategories', label: 'Top Expense Categories' },
];
