import { useMemo, useState, type ReactNode } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Grid, Paper, Typography, Box, Skeleton, Card, CardContent, Chip, Button, Stack, TextField,
  ToggleButtonGroup, ToggleButton,
} from '@mui/material';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import SavingsIcon from '@mui/icons-material/Savings';
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  LineChart, Line, AreaChart, Area,
} from 'recharts';
import { useAuth } from '../../auth/AuthContext';
import { api } from '../../api/client';
import type { DashboardSummary, DashboardBalance, Transaction } from '../../types';
import TransactionFormDialog from '../transactions/TransactionFormDialog';
import TransferDialog from '../transactions/TransferDialog';
import { DEFAULT_DASHBOARD_WIDGET_STATE } from './dashboardPreferences';

const COLORS = ['#2563eb', '#16a34a', '#ef6c00', '#ad1457', '#6a1b9a', '#00838f', '#c62828', '#558b2f', '#4527a0', '#bf360c'];

function useDashboardData(params: Record<string, string>) {
  const summary = useQuery({
    queryKey: ['dashboard', 'summary', params],
    queryFn: async () => (await api.get<{ data: DashboardSummary }>('/dashboard/summary', { params })).data.data,
  });
  const expensesByCategory = useQuery({
    queryKey: ['dashboard', 'expenses-by-category', params],
    queryFn: async () => (await api.get('/dashboard/charts/expenses-by-category', { params })).data.data,
  });
  const incomeByCategory = useQuery({
    queryKey: ['dashboard', 'income-by-category', params],
    queryFn: async () => (await api.get('/dashboard/charts/income-by-category', { params })).data.data,
  });
  const monthly = useQuery({
    queryKey: ['dashboard', 'monthly', params],
    queryFn: async () => (await api.get('/dashboard/charts/monthly-income-vs-expense', { params })).data.data,
  });
  const balanceTrend = useQuery({
    queryKey: ['dashboard', 'balance-trend', params],
    queryFn: async () => (await api.get('/dashboard/charts/balance-trend', { params })).data.data,
  });
  const savingsTrend = useQuery({
    queryKey: ['dashboard', 'savings-trend', params],
    queryFn: async () => (await api.get('/dashboard/charts/savings-trend', { params })).data.data,
  });
  const paymentMethods = useQuery({
    queryKey: ['dashboard', 'payment-methods', params],
    queryFn: async () => (await api.get('/dashboard/charts/payment-methods', { params })).data.data,
  });
  const recent = useQuery({
    queryKey: ['dashboard', 'recent', params],
    queryFn: async () => (await api.get<{ data: Transaction[] }>('/dashboard/recent-transactions', { params })).data.data,
  });
  return { summary, expensesByCategory, incomeByCategory, monthly, balanceTrend, savingsTrend, paymentMethods, recent };
}

function SummaryCard({ label, value, icon, color }: { label: string; value: number; icon: ReactNode; color: string }) {
  return (
    <Card elevation={0} sx={{ border: 1, borderColor: 'divider', height: '100%' }}>
      <CardContent>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Typography variant="body2" color="text.secondary">{label}</Typography>
          <Box sx={{ color, display: 'flex' }}>{icon}</Box>
        </Box>
        <Typography variant="h5" fontWeight={700} mt={1}>
          {value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </Typography>
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [transferOpen, setTransferOpen] = useState(false);
  const today = new Date();
  const todayString = today.toISOString().slice(0, 10);
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().slice(0, 10);
  const yearStart = new Date(today.getFullYear(), 0, 1).toISOString().slice(0, 10);
  const [period, setPeriod] = useState<'all' | 'thisMonth' | 'thisYear' | 'custom'>('thisMonth');
  const [dateFrom, setDateFrom] = useState(monthStart);
  const [dateTo, setDateTo] = useState(todayString);

  const selectedWidgets = useMemo(() => {
    const prefs = user?.dashboardWidgets ?? {};
    return {
      expensesByCategory: prefs.expensesByCategory ?? DEFAULT_DASHBOARD_WIDGET_STATE.expensesByCategory,
      incomeByCategory: prefs.incomeByCategory ?? DEFAULT_DASHBOARD_WIDGET_STATE.incomeByCategory,
      monthly: prefs.monthly ?? DEFAULT_DASHBOARD_WIDGET_STATE.monthly,
      netCashFlow: prefs.netCashFlow ?? DEFAULT_DASHBOARD_WIDGET_STATE.netCashFlow,
      balanceTrend: prefs.balanceTrend ?? DEFAULT_DASHBOARD_WIDGET_STATE.balanceTrend,
      savingsTrend: prefs.savingsTrend ?? DEFAULT_DASHBOARD_WIDGET_STATE.savingsTrend,
      paymentMethods: prefs.paymentMethods ?? DEFAULT_DASHBOARD_WIDGET_STATE.paymentMethods,
      topExpenseCategories: prefs.topExpenseCategories ?? DEFAULT_DASHBOARD_WIDGET_STATE.topExpenseCategories,
    };
  }, [user]);

  const params = useMemo(() => {
    const query: Record<string, string> = {};
    if (dateFrom) query.dateFrom = dateFrom;
    if (dateTo) query.dateTo = dateTo;
    return query;
  }, [dateFrom, dateTo]);

  const handlePeriodChange = (_: unknown, value: 'all' | 'thisMonth' | 'thisYear' | 'custom' | null) => {
    if (!value) return;
    setPeriod(value);
    if (value === 'all') {
      setDateFrom('');
      setDateTo('');
    }
    if (value === 'thisMonth') {
      setDateFrom(monthStart);
      setDateTo(todayString);
    }
    if (value === 'thisYear') {
      setDateFrom(yearStart);
      setDateTo(todayString);
    }
  };

  const handleDateFromChange = (value: string) => {
    setDateFrom(value);
    setPeriod('custom');
  };

  const handleDateToChange = (value: string) => {
    setDateTo(value);
    setPeriod('custom');
  };

  const balancesQuery = useQuery({
    queryKey: ['dashboard', 'balances'],
    queryFn: async () => (await api.get<{ data: DashboardBalance }>('/dashboard/balances')).data.data,
  });

  const { summary, expensesByCategory, incomeByCategory, monthly, balanceTrend, savingsTrend, paymentMethods, recent } = useDashboardData(params);
  const s = summary.data;
  const b = balancesQuery.data;

  const netCashFlowData = useMemo(() => (monthly.data ?? []).map((item: { month: string; income: number; expense: number }) => ({ month: item.month, net: item.income - item.expense })), [monthly.data]);
  const topExpenseCategories = useMemo(() => (expensesByCategory.data ?? []).slice(0, 5), [expensesByCategory.data]);

  return (
    <Box>
      <Box display="flex" flexDirection={{ xs: 'column', md: 'row' }} justifyContent="space-between" alignItems={{ xs: 'stretch', md: 'center' }} gap={2} mb={3}>
        <Box>
          <Typography variant="h5" fontWeight={700}>Dashboard</Typography>
          <Typography variant="body2" color="text.secondary" mt={1}>
            Apply a date range to filter all dashboard values, charts and recent transactions.
          </Typography>
        </Box>
        <Stack direction="row" spacing={1} flexWrap="wrap">
          <Button variant="outlined" onClick={() => setTransferOpen(true)}>
            Transfer funds
          </Button>
          <Button variant="contained" onClick={() => setQuickAddOpen(true)}>
            Quick add expense
          </Button>
        </Stack>
      </Box>

      <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
        <Box display="flex" flexDirection={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', sm: 'center' }} gap={2} mb={2}>
          <Box>
            <Typography variant="subtitle1" fontWeight={600}>All-time balances</Typography>
            <Typography variant="body2" color="text.secondary">Balances are shown for cash and each bank account, independent of the selected date range.</Typography>
          </Box>
          <Button variant="outlined" onClick={() => setTransferOpen(true)}>
            Transfer funds
          </Button>
        </Box>
        <Box
          sx={{
            display: 'grid',
            gap: 2,
            gridTemplateColumns: {
              xs: '1fr',
              sm: 'repeat(3, minmax(0, 1fr))',
              md: 'repeat(4, minmax(0, 1fr))',
            },
          }}
        >
          <SummaryCard label="Cash balance" value={balancesQuery.isLoading ? 0 : b?.cashBalance ?? 0} icon={<AccountBalanceWalletIcon />} color="#1d4ed8" />
          {(b?.accounts ?? []).map((account) => (
            <SummaryCard key={account.accountId} label={account.name} value={account.balance} icon={<AccountBalanceWalletIcon />} color="#0f766e" />
          ))}
          {balancesQuery.isSuccess && b?.accounts.length === 0 && (
            <Typography variant="body2" color="text.secondary">No bank accounts added yet. Add accounts in settings to track bank balances.</Typography>
          )}
        </Box>
      </Paper>

      <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
        <Stack spacing={2} mb={2}>
          <ToggleButtonGroup value={period} exclusive onChange={handlePeriodChange} size="small">
            <ToggleButton value="all">All time</ToggleButton>
            <ToggleButton value="thisMonth">This month</ToggleButton>
            <ToggleButton value="thisYear">This year</ToggleButton>
            <ToggleButton value="custom">Custom</ToggleButton>
          </ToggleButtonGroup>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center">
            <TextField
              label="From"
              type="date"
              value={dateFrom}
              onChange={(event) => handleDateFromChange(event.target.value)}
              InputLabelProps={{ shrink: true }}
              fullWidth
            />
            <TextField
              label="To"
              type="date"
              value={dateTo}
              onChange={(event) => handleDateToChange(event.target.value)}
              InputLabelProps={{ shrink: true }}
              fullWidth
            />
            <Button variant="outlined" onClick={() => { setPeriod('all'); setDateFrom(''); setDateTo(''); }} disabled={period === 'all'}>
              Reset filter
            </Button>
          </Stack>
        </Stack>
        {period !== 'all' && (
          <Typography variant="caption" color="text.secondary" mt={2} display="block">
            Showing {dateFrom || 'the earliest transaction'} to {dateTo || 'the latest transaction'}.
          </Typography>
        )}
      </Paper>

      <TransferDialog open={transferOpen} onClose={() => setTransferOpen(false)} />

      <Grid container spacing={2} mb={3}>
        {summary.isLoading || !s ? (
          Array.from({ length: 10 }).map((_, i) => (
            <Grid size={{ xs: 6, sm: 4, md: 2.4 }} key={i}><Skeleton variant="rounded" height={100} /></Grid>
          ))
        ) : (
          <>
            <Grid size={{ xs: 6, sm: 4, md: 2.4 }}><SummaryCard label="Total Balance" value={s.totalBalance} icon={<AccountBalanceWalletIcon />} color="#2563eb" /></Grid>
            <Grid size={{ xs: 6, sm: 4, md: 2.4 }}><SummaryCard label="Total Income" value={s.totalIncome} icon={<TrendingUpIcon />} color="#16a34a" /></Grid>
            <Grid size={{ xs: 6, sm: 4, md: 2.4 }}><SummaryCard label="Total Expense" value={s.totalExpense} icon={<TrendingDownIcon />} color="#dc2626" /></Grid>
            <Grid size={{ xs: 6, sm: 4, md: 2.4 }}><SummaryCard label="Selected Period Saving" value={s.monthlySaving} icon={<SavingsIcon />} color="#7c3aed" /></Grid>
            <Grid size={{ xs: 6, sm: 4, md: 2.4 }}><SummaryCard label="Selected Period Income" value={s.thisMonthIncome} icon={<TrendingUpIcon />} color="#16a34a" /></Grid>
            <Grid size={{ xs: 6, sm: 4, md: 2.4 }}><SummaryCard label="Selected Period Expense" value={s.thisMonthExpense} icon={<TrendingDownIcon />} color="#dc2626" /></Grid>
            <Grid size={{ xs: 6, sm: 4, md: 2.4 }}><SummaryCard label="Avg Daily Expense" value={s.averageDailyExpense} icon={<TrendingDownIcon />} color="#f59e0b" /></Grid>
            <Grid size={{ xs: 6, sm: 4, md: 2.4 }}><SummaryCard label="Avg Monthly Expense" value={s.averageMonthlyExpense} icon={<TrendingDownIcon />} color="#f59e0b" /></Grid>
            <Grid size={{ xs: 6, sm: 4, md: 2.4 }}><SummaryCard label="Largest Expense" value={s.largestExpense} icon={<TrendingDownIcon />} color="#dc2626" /></Grid>
            <Grid size={{ xs: 6, sm: 4, md: 2.4 }}><SummaryCard label="Largest Income" value={s.largestIncome} icon={<TrendingUpIcon />} color="#16a34a" /></Grid>
          </>
        )}
      </Grid>

      <Grid container spacing={2}>
        {selectedWidgets.expensesByCategory && (
          <Grid size={{ xs: 12, md: 6 }}>
            <Paper variant="outlined" sx={{ p: 2, height: 340 }}>
              <Typography variant="subtitle1" fontWeight={600} mb={1}>Expenses by Category</Typography>
              <ResponsiveContainer width="100%" height="90%">
                <PieChart>
                  <Pie data={expensesByCategory.data ?? []} dataKey="value" nameKey="name" innerRadius={0} outerRadius={100} label>
                    {(expensesByCategory.data ?? []).map((_: unknown, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip /><Legend />
                </PieChart>
              </ResponsiveContainer>
            </Paper>
          </Grid>
        )}

        {selectedWidgets.incomeByCategory && (
          <Grid size={{ xs: 12, md: 6 }}>
            <Paper variant="outlined" sx={{ p: 2, height: 340 }}>
              <Typography variant="subtitle1" fontWeight={600} mb={1}>Income by Category</Typography>
              <ResponsiveContainer width="100%" height="90%">
                <PieChart>
                  <Pie data={incomeByCategory.data ?? []} dataKey="value" nameKey="name" outerRadius={100} label>
                    {(incomeByCategory.data ?? []).map((_: unknown, i: number) => <Cell key={i} fill={COLORS[(i + 3) % COLORS.length]} />)}
                  </Pie>
                  <Tooltip /><Legend />
                </PieChart>
              </ResponsiveContainer>
            </Paper>
          </Grid>
        )}

        {selectedWidgets.monthly && (
          <Grid size={{ xs: 12, md: 6 }}>
            <Paper variant="outlined" sx={{ p: 2, height: 340 }}>
              <Typography variant="subtitle1" fontWeight={600} mb={1}>Monthly Income vs Expense</Typography>
              <ResponsiveContainer width="100%" height="90%">
                <BarChart data={monthly.data ?? []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" /><YAxis /><Tooltip /><Legend />
                  <Bar dataKey="income" fill="#16a34a" />
                  <Bar dataKey="expense" fill="#dc2626" />
                </BarChart>
              </ResponsiveContainer>
            </Paper>
          </Grid>
        )}

        {selectedWidgets.netCashFlow && (
          <Grid size={{ xs: 12, md: 6 }}>
            <Paper variant="outlined" sx={{ p: 2, height: 340 }}>
              <Typography variant="subtitle1" fontWeight={600} mb={1}>Monthly Net Cash Flow</Typography>
              <ResponsiveContainer width="100%" height="90%">
                <LineChart data={netCashFlowData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" /><YAxis /><Tooltip />
                  <Line type="monotone" dataKey="net" stroke="#0ea5e9" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </Paper>
          </Grid>
        )}

        {selectedWidgets.balanceTrend && (
          <Grid size={{ xs: 12, md: 6 }}>
            <Paper variant="outlined" sx={{ p: 2, height: 340 }}>
              <Typography variant="subtitle1" fontWeight={600} mb={1}>Balance Trend</Typography>
              <ResponsiveContainer width="100%" height="90%">
                <LineChart data={balanceTrend.data ?? []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" /><YAxis /><Tooltip />
                  <Line type="monotone" dataKey="balance" stroke="#2563eb" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </Paper>
          </Grid>
        )}

        {selectedWidgets.savingsTrend && (
          <Grid size={{ xs: 12, md: 6 }}>
            <Paper variant="outlined" sx={{ p: 2, height: 340 }}>
              <Typography variant="subtitle1" fontWeight={600} mb={1}>Savings Trend</Typography>
              <ResponsiveContainer width="100%" height="90%">
                <AreaChart data={savingsTrend.data ?? []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" /><YAxis /><Tooltip />
                  <Area type="monotone" dataKey="savings" stroke="#7c3aed" fill="#7c3aed33" />
                </AreaChart>
              </ResponsiveContainer>
            </Paper>
          </Grid>
        )}

        {selectedWidgets.paymentMethods && (
          <Grid size={{ xs: 12, md: 6 }}>
            <Paper variant="outlined" sx={{ p: 2, height: 340 }}>
              <Typography variant="subtitle1" fontWeight={600} mb={1}>Payment Methods</Typography>
              <ResponsiveContainer width="100%" height="90%">
                <PieChart>
                  <Pie data={paymentMethods.data ?? []} dataKey="value" nameKey="name" innerRadius={50} outerRadius={100} label>
                    {(paymentMethods.data ?? []).map((_: unknown, i: number) => <Cell key={i} fill={COLORS[(i + 5) % COLORS.length]} />)}
                  </Pie>
                  <Tooltip /><Legend />
                </PieChart>
              </ResponsiveContainer>
            </Paper>
          </Grid>
        )}

        {selectedWidgets.topExpenseCategories && (
          <Grid size={{ xs: 12, md: 6 }}>
            <Paper variant="outlined" sx={{ p: 2, height: 340 }}>
              <Typography variant="subtitle1" fontWeight={600} mb={1}>Top Expense Categories</Typography>
              <ResponsiveContainer width="100%" height="90%">
                <BarChart data={topExpenseCategories}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" /><YAxis /><Tooltip />
                  <Bar dataKey="value" fill="#ef6c00" />
                </BarChart>
              </ResponsiveContainer>
            </Paper>
          </Grid>
        )}
      </Grid>

      <Paper variant="outlined" sx={{ p: 2, mt: 2 }}>
        <Typography variant="subtitle1" fontWeight={600} mb={1}>Recent Transactions</Typography>
        {(recent.data ?? []).length === 0 && !recent.isLoading && (
          <Typography variant="body2" color="text.secondary">No transactions yet. Add your first one from the Transactions page.</Typography>
        )}
        {(recent.data ?? []).map((t) => (
          <Box key={t.id} display="flex" justifyContent="space-between" alignItems="center" py={1} borderBottom={1} borderColor="divider">
            <Box>
              <Typography variant="body2" fontWeight={500}>{t.category?.name}{t.subcategory ? ` / ${t.subcategory.name}` : ''}</Typography>
              <Typography variant="caption" color="text.secondary">{t.date}{t.notes ? ` — ${t.notes}` : ''}</Typography>
            </Box>
            <Chip
              label={`${t.type === 'income' ? '+' : '-'}${Number(t.amount).toFixed(2)}`}
              color={t.type === 'income' ? 'success' : 'error'}
              size="small"
              variant="outlined"
            />
          </Box>
        ))}
      </Paper>

      <TransactionFormDialog
        open={quickAddOpen}
        onClose={() => {
          setQuickAddOpen(false);
          queryClient.invalidateQueries({ queryKey: ['dashboard'] });
        }}
        editing={null}
      />
    </Box>
  );
}
