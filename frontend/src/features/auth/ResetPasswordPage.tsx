import { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Box, Paper, TextField, Button, Typography, Alert } from '@mui/material';
import { api } from '../../api/client';

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token') || '';
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await api.post('/auth/reset-password', { token, newPassword, confirmPassword });
      navigate('/login');
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center', bgcolor: 'background.default', p: 2 }}>
      <Paper elevation={3} sx={{ p: 4, width: '100%', maxWidth: 420 }}>
        <Typography variant="h5" fontWeight={700} mb={2}>Set a new password</Typography>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        <Box component="form" onSubmit={onSubmit}>
          <TextField label="New password" type="password" fullWidth required value={newPassword} onChange={(e) => setNewPassword(e.target.value)} sx={{ mb: 2 }} />
          <TextField label="Confirm password" type="password" fullWidth required value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} sx={{ mb: 2 }} />
          <Button type="submit" variant="contained" fullWidth disabled={loading}>{loading ? 'Resetting…' : 'Reset password'}</Button>
        </Box>
      </Paper>
    </Box>
  );
}
