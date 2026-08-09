import { useEffect } from 'react';
import { useForm, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, MenuItem, Stack, Typography,
} from '@mui/material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { api } from '../../api/client';
import type { Account } from '../../types';

const schema = z.object({
  fromAccountId: z.string().optional(),
  toAccountId: z.string().optional(),
  amount: z.coerce.number().positive('Amount must be greater than 0'),
  date: z.string().min(1, 'Date is required'),
  notes: z.string().max(1000).optional(),
});

type FormValues = z.infer<typeof schema>;

export default function TransferDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const queryClient = useQueryClient();
  const resolver: Resolver<FormValues> = zodResolver(schema) as Resolver<FormValues>;
  const { register, handleSubmit, setError, formState: { errors }, reset } = useForm<FormValues>({
    resolver,
    defaultValues: {
      fromAccountId: '',
      toAccountId: '',
      amount: undefined,
      date: dayjs().format('YYYY-MM-DD'),
      notes: '',
    },
  });

  const accountsQuery = useQuery({
    queryKey: ['accounts'],
    queryFn: async () => (await api.get<{ data: Account[] }>('/accounts')).data.data,
  });

  useEffect(() => {
    if (open) {
      reset({
        fromAccountId: '',
        toAccountId: '',
        amount: undefined,
        date: dayjs().format('YYYY-MM-DD'),
        notes: '',
      });
    }
  }, [open, reset]);

  const mutation = useMutation({
    mutationFn: async (values: FormValues) => {
      const payload = {
        fromAccountId: values.fromAccountId || null,
        toAccountId: values.toAccountId || null,
        amount: values.amount,
        date: values.date,
        notes: values.notes || undefined,
      } as const;
      return api.post('/transactions/transfer', payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      onClose();
    },
  });

  const onSubmit = (values: FormValues) => {
    const from = values.fromAccountId === 'cash' ? null : values.fromAccountId || null;
    const to = values.toAccountId === 'cash' ? null : values.toAccountId || null;
    if (from === to) {
      setError('toAccountId', { type: 'manual', message: 'Source and destination must differ' });
      return;
    }
    mutation.mutate({
      ...values,
      fromAccountId: from ?? undefined,
      toAccountId: to ?? undefined,
    });
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Transfer Funds</DialogTitle>
      <DialogContent>
        <Stack spacing={2} mt={1}>
          <Typography variant="body2" color="text.secondary">
            Move money between cash and bank accounts. Select cash or a bank account as the source and destination.
          </Typography>
          <TextField
            select
            label="From"
            fullWidth
            defaultValue=""
            {...register('fromAccountId')}
            error={!!errors.fromAccountId}
            helperText={errors.fromAccountId?.message}
          >
            <MenuItem value="cash">Cash</MenuItem>
            {(accountsQuery.data ?? []).map((account) => (
              <MenuItem key={account.id} value={account.id}>{account.name}</MenuItem>
            ))}
          </TextField>
          <TextField
            select
            label="To"
            fullWidth
            defaultValue=""
            {...register('toAccountId')}
            error={!!errors.toAccountId}
            helperText={errors.toAccountId?.message}
          >
            <MenuItem value="cash">Cash</MenuItem>
            {(accountsQuery.data ?? []).map((account) => (
              <MenuItem key={account.id} value={account.id}>{account.name}</MenuItem>
            ))}
          </TextField>
          <TextField label="Amount" type="number" fullWidth inputProps={{ step: '0.01' }} {...register('amount')} error={!!errors.amount} helperText={errors.amount?.message} />
          <TextField label="Date" type="date" fullWidth InputLabelProps={{ shrink: true }} {...register('date')} error={!!errors.date} helperText={errors.date?.message} />
          <TextField label="Notes (optional)" fullWidth multiline rows={2} {...register('notes')} error={!!errors.notes} helperText={errors.notes?.message} />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={handleSubmit(onSubmit)} disabled={mutation.isPending}>
          {mutation.isPending ? 'Transferring…' : 'Transfer'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
