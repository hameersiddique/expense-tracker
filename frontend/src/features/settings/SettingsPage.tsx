import { useState, useEffect } from 'react';
import { Box, Typography, Paper, TextField, MenuItem, Button, Stack, Tabs, Tab, Alert } from '@mui/material';
import { useMutation } from '@tanstack/react-query';
import { useAuth } from '../../auth/AuthContext';
import { api } from '../../api/client';

const CURRENCIES = ['USD', 'EUR', 'GBP', 'KWD', 'PKR', 'SAR'];

export default function SettingsPage() {
  const { user, refreshUser } = useAuth();
  const [tab, setTab] = useState(0);
  const [message, setMessage] = useState<string | null>(null);

  const [firstName, setFirstName] = useState(user?.firstName ?? '');
  const [lastName, setLastName] = useState(user?.lastName ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [currency, setCurrency] = useState(user?.currency ?? 'USD');
  const [theme, setTheme] = useState(user?.theme ?? 'system');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    if (user) { setFirstName(user.firstName); setLastName(user.lastName); setEmail(user.email); setCurrency(user.currency); setTheme(user.theme); }
  }, [user]);

  const profileMutation = useMutation({
    mutationFn: async () => api.patch('/users/me/profile', { firstName, lastName, email }),
    onSuccess: async () => { await refreshUser(); setMessage('Profile updated'); },
  });

  const settingsMutation = useMutation({
    mutationFn: async () => api.patch('/users/me/settings', { currency, theme }),
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
      <Paper variant="outlined">
        <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tab label="Profile" />
          <Tab label="Preferences" />
          <Tab label="Security" />
        </Tabs>
        <Box p={3}>
          {tab === 0 && (
            <Stack spacing={2} maxWidth={420}>
              <TextField label="First name" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
              <TextField label="Last name" value={lastName} onChange={(e) => setLastName(e.target.value)} />
              <TextField label="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
              <Button variant="contained" onClick={() => profileMutation.mutate()} disabled={profileMutation.isPending}>Save Profile</Button>
            </Stack>
          )}
          {tab === 1 && (
            <Stack spacing={2} maxWidth={420}>
              <TextField select label="Default Currency" value={currency} onChange={(e) => setCurrency(e.target.value)}>
                {CURRENCIES.map((c) => <MenuItem key={c} value={c}>{c}</MenuItem>)}
              </TextField>
              <TextField select label="Theme" value={theme} onChange={(e) => setTheme(e.target.value as 'light' | 'dark' | 'system')}>
                <MenuItem value="light">Light</MenuItem>
                <MenuItem value="dark">Dark</MenuItem>
                <MenuItem value="system">System</MenuItem>
              </TextField>
              <Button variant="contained" onClick={() => settingsMutation.mutate()} disabled={settingsMutation.isPending}>Save Preferences</Button>
            </Stack>
          )}
          {tab === 2 && (
            <Stack spacing={2} maxWidth={420}>
              <TextField label="Current password" type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
              <TextField label="New password" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
              <TextField label="Confirm new password" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
              <Button variant="contained" onClick={() => passwordMutation.mutate()} disabled={passwordMutation.isPending}>Change Password</Button>
            </Stack>
          )}
        </Box>
      </Paper>
    </Box>
  );
}
