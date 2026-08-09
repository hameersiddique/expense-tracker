import { useState, useEffect, type ChangeEvent, type SyntheticEvent } from 'react';
import { Box, Typography, Paper, TextField, MenuItem, Button, Stack, Tabs, Tab, Alert, Checkbox, FormControlLabel, FormGroup, IconButton } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../auth/AuthContext';
import { api } from '../../api/client';
import type { Account } from '../../types';
import { DASHBOARD_WIDGETS, DEFAULT_DASHBOARD_WIDGET_STATE } from '../dashboard/dashboardPreferences';

const CURRENCIES = ['USD', 'EUR', 'GBP', 'KWD', 'PKR', 'SAR'];

export default function SettingsPage() {
  const { user, refreshUser } = useAuth();
  const [tab, setTab] = useState(0);
  const [message, setMessage] = useState<string | null>(null);
  const [accountMessage, setAccountMessage] = useState<string | null>(null);

  const [firstName, setFirstName] = useState(user?.firstName ?? '');
  const [lastName, setLastName] = useState(user?.lastName ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [currency, setCurrency] = useState(user?.currency ?? 'USD');
  const [theme, setTheme] = useState(user?.theme ?? 'system');
  const [dashboardWidgets, setDashboardWidgets] = useState<Record<string, boolean>>(user?.dashboardWidgets ?? DEFAULT_DASHBOARD_WIDGET_STATE);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [accountId, setAccountId] = useState<string | null>(null);
  const [accountName, setAccountName] = useState('');
  const [accountBalance, setAccountBalance] = useState('0');
  const [accountCurrency, setAccountCurrency] = useState('USD');
  const [accountIsDefault, setAccountIsDefault] = useState(false);

  useEffect(() => {
    if (user) {
      setFirstName(user.firstName);
      setLastName(user.lastName);
      setEmail(user.email);
      setCurrency(user.currency);
      setTheme(user.theme);
      setDashboardWidgets(user.dashboardWidgets ?? DEFAULT_DASHBOARD_WIDGET_STATE);
    }
  }, [user]);

  const queryClient = useQueryClient();
  const accountsQuery = useQuery({
    queryKey: ['accounts'],
    queryFn: async () => (await api.get<{ data: Account[] }>('/accounts')).data.data,
  });

  const createAccountMutation = useMutation({
    mutationFn: async () => api.post('/accounts', {
      name: accountName,
      initialBalance: parseFloat(accountBalance) || 0,
      currency: accountCurrency,
      isDefault: accountIsDefault,
    }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['accounts'] });
      setAccountMessage('Account saved');
      setAccountId(null);
      setAccountName('');
      setAccountBalance('0');
      setAccountCurrency('USD');
      setAccountIsDefault(false);
    },
  });

  const updateAccountMutation = useMutation({
    mutationFn: async () => api.patch(`/accounts/${accountId}`, {
      name: accountName,
      initialBalance: parseFloat(accountBalance) || 0,
      currency: accountCurrency,
      isDefault: accountIsDefault,
    }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['accounts'] });
      setAccountMessage('Account updated');
      setAccountId(null);
      setAccountName('');
      setAccountBalance('0');
      setAccountCurrency('USD');
      setAccountIsDefault(false);
    },
  });

  const deleteAccountMutation = useMutation({
    mutationFn: async (id: string) => api.delete(`/accounts/${id}`),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['accounts'] });
      setAccountMessage('Account deleted');
    },
    onError: (error: any) => {
      setAccountMessage(error?.response?.data?.message ?? 'Failed to delete account');
    },
  });

  const profileMutation = useMutation({
    mutationFn: async () => api.patch('/users/me/profile', { firstName, lastName, email }),
    onSuccess: async () => { await refreshUser(); setMessage('Profile updated'); },
  });

  const settingsMutation = useMutation({
    mutationFn: async () => api.patch('/users/me/settings', { currency, theme, dashboardWidgets }),
    onSuccess: async () => { await refreshUser(); setMessage('Preferences updated'); },
  });

  const passwordMutation = useMutation({
    mutationFn: async () => api.post('/auth/change-password', { currentPassword, newPassword, confirmPassword }),
    onSuccess: () => { setMessage('Password changed'); setCurrentPassword(''); setNewPassword(''); setConfirmPassword(''); },
  });

  return (
    <Box>
      <Typography variant="h5" fontWeight={700} mb={2}>Settings</Typography>
      {message && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setMessage(null)}>{message}</Alert>}
      {accountMessage && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setAccountMessage(null)}>{accountMessage}</Alert>}
      <Paper variant="outlined">
        <Tabs value={tab} onChange={(_event: SyntheticEvent, v: number) => setTab(v)} sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tab label="Profile" />
          <Tab label="Preferences" />
          <Tab label="Accounts" />
          <Tab label="Security" />
        </Tabs>
        <Box p={3}>
          {tab === 0 && (
            <Stack spacing={2} maxWidth={420}>
              <TextField label="First name" value={firstName} onChange={(e: ChangeEvent<HTMLInputElement>) => setFirstName(e.target.value)} />
              <TextField label="Last name" value={lastName} onChange={(e: ChangeEvent<HTMLInputElement>) => setLastName(e.target.value)} />
              <TextField label="Email" value={email} onChange={(e: ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)} />
              <Button variant="contained" onClick={() => profileMutation.mutate()} disabled={profileMutation.isPending}>Save Profile</Button>
            </Stack>
          )}
          {tab === 1 && (
            <Stack spacing={2} maxWidth={420}>
              <TextField select label="Default Currency" value={currency} onChange={(e: ChangeEvent<HTMLInputElement>) => setCurrency(e.target.value)}>
                {CURRENCIES.map((c) => <MenuItem key={c} value={c}>{c}</MenuItem>)}
              </TextField>
              <TextField select label="Theme" value={theme} onChange={(e: ChangeEvent<HTMLInputElement>) => setTheme(e.target.value as 'light' | 'dark' | 'system')}>
                <MenuItem value="light">Light</MenuItem>
                <MenuItem value="dark">Dark</MenuItem>
                <MenuItem value="system">System</MenuItem>
              </TextField>
              <Box>
                <Typography variant="subtitle2" mb={1}>Dashboard widgets</Typography>
                <FormGroup>
                  {DASHBOARD_WIDGETS.map((widget) => (
                    <FormControlLabel
                      key={widget.key}
                      control={(
                        <Checkbox
                          checked={dashboardWidgets[widget.key] ?? true}
                          onChange={(event: ChangeEvent<HTMLInputElement>) => setDashboardWidgets((prev: Record<string, boolean>) => ({
                            ...prev,
                            [widget.key]: event.target.checked,
                          }))}
                        />
                      )}
                      label={widget.label}
                    />
                  ))}
                </FormGroup>
              </Box>
              <Button variant="contained" onClick={() => settingsMutation.mutate()} disabled={settingsMutation.isPending}>Save Preferences</Button>
            </Stack>
          )}
          {tab === 2 && (
            <Stack spacing={3}>
              <Box maxWidth={420}>
                <Typography variant="subtitle1" mb={2}>Create or edit account</Typography>
                <Stack spacing={2}>
                  <TextField label="Account name" value={accountName} onChange={(e: ChangeEvent<HTMLInputElement>) => setAccountName(e.target.value)} fullWidth />
                  <TextField label="Starting balance" type="number" value={accountBalance} onChange={(e: ChangeEvent<HTMLInputElement>) => setAccountBalance(e.target.value)} fullWidth />
                  <TextField select label="Currency" value={accountCurrency} onChange={(e: ChangeEvent<HTMLInputElement>) => setAccountCurrency(e.target.value)} fullWidth>
                    {CURRENCIES.map((c) => <MenuItem key={c} value={c}>{c}</MenuItem>)}
                  </TextField>
                  <FormControlLabel
                    control={<Checkbox checked={accountIsDefault} onChange={(e: ChangeEvent<HTMLInputElement>) => setAccountIsDefault(e.target.checked)} />}
                    label="Set as default account"
                  />
                  <Stack direction="row" spacing={1}>
                    <Button
                      variant="contained"
                      onClick={() => (accountId ? updateAccountMutation.mutate() : createAccountMutation.mutate())}
                      disabled={createAccountMutation.isPending || updateAccountMutation.isPending}
                    >
                      {accountId ? 'Save changes' : 'Create account'}
                    </Button>
                    <Button
                      variant="outlined"
                      onClick={() => {
                        setAccountId(null);
                        setAccountName('');
                        setAccountBalance('0');
                        setAccountCurrency('USD');
                        setAccountIsDefault(false);
                      }}
                    >
                      Reset
                    </Button>
                  </Stack>
                </Stack>
              </Box>
              <Box maxWidth={720}>
                <Typography variant="subtitle1" mb={2}>Your accounts</Typography>
                {(accountsQuery.isLoading && <Typography>Loading accounts…</Typography>) || (accountsQuery.data?.length ? (
                  <Stack spacing={1}>
                    {accountsQuery.data.map((account: Account) => (
                      <Paper key={account.id} variant="outlined" sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Box>
                          <Typography fontWeight={600}>{account.name}</Typography>
                          <Typography variant="body2" color="text.secondary">{account.currency} {Number(account.initialBalance).toFixed(2)} {account.isDefault ? '(default)' : ''}</Typography>
                        </Box>
                        <Stack direction="row" spacing={1}>
                          <IconButton size="small" onClick={() => {
                            setAccountId(account.id);
                            setAccountName(account.name);
                            setAccountBalance(account.initialBalance);
                            setAccountCurrency(account.currency);
                            setAccountIsDefault(account.isDefault);
                          }}>
                            <EditIcon fontSize="small" />
                          </IconButton>
                          <IconButton size="small" color="error" onClick={() => deleteAccountMutation.mutate(account.id)}>
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Stack>
                      </Paper>
                    ))}
                  </Stack>
                ) : (
                  <Typography color="text.secondary">No accounts yet. Create a bank account or other account type above.</Typography>
                ))}
              </Box>
            </Stack>
          )}
          {tab === 3 && (
            <Stack spacing={2} maxWidth={420}>
              <TextField label="Current password" type="password" value={currentPassword} onChange={(e: ChangeEvent<HTMLInputElement>) => setCurrentPassword(e.target.value)} />
              <TextField label="New password" type="password" value={newPassword} onChange={(e: ChangeEvent<HTMLInputElement>) => setNewPassword(e.target.value)} />
              <TextField label="Confirm new password" type="password" value={confirmPassword} onChange={(e: ChangeEvent<HTMLInputElement>) => setConfirmPassword(e.target.value)} />
              <Button variant="contained" onClick={() => passwordMutation.mutate()} disabled={passwordMutation.isPending}>Change Password</Button>
            </Stack>
          )}
        </Box>
      </Paper>
    </Box>
  );
}
