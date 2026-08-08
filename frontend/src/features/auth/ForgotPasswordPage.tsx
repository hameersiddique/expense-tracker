import { useState } from 'react';
import { Box, Paper, TextField, Button, Typography, Alert, Link } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { api } from '../../api/client';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.post('/auth/forgot-password', { email });
      setMessage(data.data.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center', bgcolor: 'background.default', p: 2 }}>
      <Paper elevation={3} sx={{ p: 4, width: '100%', maxWidth: 420 }}>
        <Typography variant="h5" fontWeight={700} mb={0.5}>Reset your password</Typography>
        <Typography variant="body2" color="text.secondary" mb={3}>We'll email you a reset link</Typography>
        {message && <Alert severity="success" sx={{ mb: 2 }}>{message}</Alert>}
        <Box component="form" onSubmit={onSubmit}>
          <TextField label="Email" type="email" fullWidth required value={email} onChange={(e) => setEmail(e.target.value)} sx={{ mb: 2 }} />
          <Button type="submit" variant="contained" fullWidth disabled={loading}>{loading ? 'Sending…' : 'Send reset link'}</Button>
        </Box>
        <Box mt={2} textAlign="center">
          <Link component={RouterLink} to="/login" variant="body2">Back to sign in</Link>
        </Box>
      </Paper>
    </Box>
  );
}
