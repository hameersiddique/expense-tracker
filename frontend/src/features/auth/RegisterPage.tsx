import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { Box, Paper, TextField, Button, Typography, Alert, Link, Stack, Grid } from '@mui/material';
import { useAuth } from '../../auth/AuthContext';

const passwordRules = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>]).{8,}$/;

const schema = z.object({
  firstName: z.string().min(1, 'First name is required').max(100),
  lastName: z.string().min(1, 'Last name is required').max(100),
  email: z.string().email('Enter a valid email'),
  password: z.string().regex(passwordRules, 'Min 8 chars incl. upper, lower, number & symbol'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match', path: ['confirmPassword'],
});
type FormValues = z.infer<typeof schema>;

export default function RegisterPage() {
  const { register: registerUser } = useAuth();
  const navigate = useNavigate();
  const [serverError, setServerError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = async (values: FormValues) => {
    setServerError(null);
    setLoading(true);
    try {
      await registerUser(values);
      navigate('/');
    } catch (err: any) {
      const msg = err?.response?.data?.message;
      setServerError(Array.isArray(msg) ? msg.join(', ') : msg || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center', bgcolor: 'background.default', p: 2 }}>
      <Paper elevation={3} sx={{ p: 4, width: '100%', maxWidth: 480 }}>
        <Typography variant="h5" fontWeight={700} mb={0.5}>Create your account</Typography>
        <Typography variant="body2" color="text.secondary" mb={3}>Start tracking your expenses in minutes</Typography>

        {serverError && <Alert severity="error" sx={{ mb: 2 }}>{serverError}</Alert>}

        <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
          <Grid container spacing={2}>
            <Grid size={{ xs: 6 }}>
              <TextField label="First name" fullWidth {...register('firstName')} error={!!errors.firstName} helperText={errors.firstName?.message} />
            </Grid>
            <Grid size={{ xs: 6 }}>
              <TextField label="Last name" fullWidth {...register('lastName')} error={!!errors.lastName} helperText={errors.lastName?.message} />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField label="Email" type="email" fullWidth {...register('email')} error={!!errors.email} helperText={errors.email?.message} />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField label="Password" type="password" fullWidth {...register('password')} error={!!errors.password} helperText={errors.password?.message} />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField label="Confirm password" type="password" fullWidth {...register('confirmPassword')} error={!!errors.confirmPassword} helperText={errors.confirmPassword?.message} />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <Button type="submit" variant="contained" size="large" fullWidth disabled={loading}>
                {loading ? 'Creating account…' : 'Create Account'}
              </Button>
            </Grid>
          </Grid>
        </Box>

        <Stack direction="row" justifyContent="center" mt={2}>
          <Typography variant="body2" color="text.secondary" mr={0.5}>Already have an account?</Typography>
          <Link component={RouterLink} to="/login" variant="body2">Sign in</Link>
        </Stack>
      </Paper>
    </Box>
  );
}
