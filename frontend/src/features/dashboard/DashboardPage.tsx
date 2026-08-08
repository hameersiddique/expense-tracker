import { useQuery } from '@tanstack/react-query';
import { Grid, Paper, Typography, Box, Skeleton, Card, CardContent, Chip } from '@mui/material';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import SavingsIcon from '@mui/icons-material/Savings';
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  LineChart, Line, AreaChart, Area,
} from 'recharts';
import { api } from '../../api/client';
import type { DashboardSummary, Transaction } from '../../types';

const COLORS = ['#2563eb', '#16a34a', '#ef6c00', '#ad1457', '#6a1b9a', '#00838f', '#c62828', '#558b2f', '#4527a0', '#bf360c'];

function useDashboardData() {
  const summary = useQuery({
    queryKey: ['dashboard', 'summary'],
    queryFn: async () => (await api.get<{ data: DashboardSummary }>('/dashboard/summary')).data.data,
  });
  const expensesByCategory = useQuery({
    queryKey: ['dashboard', 'expenses-by-category'],
    queryFn: async () => (await api.get('/dashboard/charts/expenses-by-category')).data.data,
  });
  const incomeByCategory = useQuery({
    queryKey: ['dashboard', 'income-by-category'],
    queryFn: async () => (await api.get('/dashboard/charts/income-by-category')).data.data,
  });
  const monthly = useQuery({
    queryKey: ['dashboard', 'monthly'],
    queryFn: async () => (await api.get('/dashboard/charts/monthly-income-vs-expense')).data.data,
  });
  const balanceTrend = useQuery({
    queryKey: ['dashboard', 'balance-trend'],
    queryFn: async () => (await api.get('/dashboard/charts/balance-trend')).data.data,
  });
  const savingsTrend = useQuery({
    queryKey: ['dashboard', 'savings-trend'],
    queryFn: async () => (await api.get('/dashboard/charts/savings-trend')).data.data,
  });
  const paymentMethods = useQuery({
    queryKey: ['dashboard', 'payment-methods'],
    queryFn: async () => (await api.get('/dashboard/charts/payment-methods')).data.data,
  });
  const recent = useQuery({
    queryKey: ['dashboard', 'recent'],
    queryFn: async () => (await api.get<{ data: Transaction[] }>('/dashboard/recent-transactions')).data.data,
  });
  return { summary, expensesByCategory, incomeByCategory, monthly, balanceTrend, savingsTrend, paymentMethods, recent };
}

function SummaryCard({ label, value, icon, color }: { label: string; value: number; icon: React.ReactNode; color: string }) {
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
  const { summary, expensesByCategory, incomeByCategory, monthly, balanceTrend, savingsTrend, paymentMethods, recent } = useDashboardData();

  const s = summary.data;

  return (
    <Box>
      <Typography variant="h5" fontWeight={700} mb={3}>Dashboard</Typography>

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
            <Grid size={{ xs: 6, sm: 4, md: 2.4 }}><SummaryCard label="Monthly Saving" value={s.monthlySaving} icon={<SavingsIcon />} color="#7c3aed" /></Grid>
            <Grid size={{ xs: 6, sm: 4, md: 2.4 }}><SummaryCard label="This Month Income" value={s.thisMonthIncome} icon={<TrendingUpIcon />} color="#16a34a" /></Grid>
            <Grid size={{ xs: 6, sm: 4, md: 2.4 }}><SummaryCard label="This Month Expense" value={s.thisMonthExpense} icon={<TrendingDownIcon />} color="#dc2626" /></Grid>
            <Grid size={{ xs: 6, sm: 4, md: 2.4 }}><SummaryCard label="Avg Daily Expense" value={s.averageDailyExpense} icon={<TrendingDownIcon />} color="#f59e0b" /></Grid>
            <Grid size={{ xs: 6, sm: 4, md: 2.4 }}><SummaryCard label="Avg Monthly Expense" value={s.averageMonthlyExpense} icon={<TrendingDownIcon />} color="#f59e0b" /></Grid>
            <Grid size={{ xs: 6, sm: 4, md: 2.4 }}><SummaryCard label="Largest Expense" value={s.largestExpense} icon={<TrendingDownIcon />} color="#dc2626" /></Grid>
            <Grid size={{ xs: 6, sm: 4, md: 2.4 }}><SummaryCard label="Largest Income" value={s.largestIncome} icon={<TrendingUpIcon />} color="#16a34a" /></Grid>
          </>
        )}
      </Grid>

      <Grid container spacing={2}>
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
    </Box>
  );
}
