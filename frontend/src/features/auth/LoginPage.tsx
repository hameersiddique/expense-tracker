import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import {
  Box, Paper, TextField, Button, Typography, Alert, Checkbox, FormControlLabel, Link, Stack,
} from '@mui/material';
import { useAuth } from '../../auth/AuthContext';

const schema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
  rememberMe: z.boolean().optional(),
});
type FormValues = z.infer<typeof schema>;

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [serverError, setServerError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { rememberMe: false },
  });

  const onSubmit = async (values: FormValues) => {
    setServerError(null);
    setLoading(true);
    try {
      await login(values.email, values.password, values.rememberMe);
      navigate('/');
    } catch (err: any) {
      setServerError(err?.response?.data?.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center', bgcolor: 'background.default', p: 2 }}>
      <Paper elevation={3} sx={{ p: 4, width: '100%', maxWidth: 420 }}>
        <Typography variant="h5" fontWeight={700} mb={0.5}>Welcome back 👋</Typography>
        <Typography variant="body2" color="text.secondary" mb={3}>Sign in to manage your expenses</Typography>

        {serverError && <Alert severity="error" sx={{ mb: 2 }}>{serverError}</Alert>}

        <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
          <Stack spacing={2}>
            <TextField
              label="Email" type="email" fullWidth autoFocus
              {...register('email')} error={!!errors.email} helperText={errors.email?.message}
            />
            <TextField
              label="Password" type="password" fullWidth
              {...register('password')} error={!!errors.password} helperText={errors.password?.message}
            />
            <FormControlLabel control={<Checkbox {...register('rememberMe')} />} label="Remember me" />
            <Button type="submit" variant="contained" size="large" fullWidth disabled={loading}>
              {loading ? 'Signing in…' : 'Sign In'}
            </Button>
          </Stack>
        </Box>

        <Stack direction="row" justifyContent="space-between" mt={2}>
          <Link component={RouterLink} to="/forgot-password" variant="body2">Forgot password?</Link>
          <Link component={RouterLink} to="/register" variant="body2">Create an account</Link>
        </Stack>
      </Paper>
    </Box>
  );
}
