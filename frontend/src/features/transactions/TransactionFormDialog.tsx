import { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, MenuItem, Stack, ToggleButtonGroup, ToggleButton,
} from '@mui/material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { api } from '../../api/client';
import type { Category, PaymentMethod, Account, Transaction } from '../../types';

const schema = z.object({
  type: z.enum(['income', 'expense']),
  amount: z.coerce.number().positive('Amount must be greater than 0'),
  categoryId: z.string().uuid('Select a category'),
  subcategoryId: z.string().optional(),
  date: z.string().min(1, 'Date is required'),
  time: z.string().optional(),
  paymentMethodId: z.string().optional(),
  accountId: z.string().optional(),
  notes: z.string().max(1000).optional(),
});
type FormValues = z.input<typeof schema>;
type FormOutput = z.output<typeof schema>;

export default function TransactionFormDialog({
  open, onClose, editing,
}: { open: boolean; onClose: () => void; editing: Transaction | null }) {
  const queryClient = useQueryClient();
  const [type, setType] = useState<'income' | 'expense'>(editing?.type ?? 'expense');

  const { control, register, handleSubmit, watch, reset, setError, setValue, formState: { errors } } = useForm<FormValues, any, FormOutput>({
    resolver: zodResolver(schema),
    defaultValues: {
      type: editing?.type ?? 'expense',
      amount: editing ? Number(editing.amount) : undefined,
      categoryId: editing?.categoryId ?? '',
      subcategoryId: editing?.subcategoryId ?? '',
      date: editing?.date ? dayjs(editing.date).format('YYYY-MM-DD') : dayjs().format('YYYY-MM-DD'),
      time: editing?.date ? dayjs(editing.date).format('HH:mm') : '',
      paymentMethodId: editing?.paymentMethodId ?? '',
      accountId: editing?.accountId ?? '',
      notes: editing?.notes ?? '',
    },
  });

  useEffect(() => {
    reset({
      type: editing?.type ?? 'expense',
      amount: editing ? Number(editing.amount) : undefined,
      categoryId: editing?.categoryId ?? '',
      subcategoryId: editing?.subcategoryId ?? '',
      date: editing?.date ? dayjs(editing.date).format('YYYY-MM-DD') : dayjs().format('YYYY-MM-DD'),
      time: editing?.date ? dayjs(editing.date).format('HH:mm') : '',
      paymentMethodId: editing?.paymentMethodId ?? '',
      accountId: editing?.accountId ?? '',
      notes: editing?.notes ?? '',
    });
    setType(editing?.type ?? 'expense');
  }, [editing, open]); // eslint-disable-line react-hooks/exhaustive-deps

  const categoriesQuery = useQuery({
    queryKey: ['categories'],
    queryFn: async () => (await api.get<{ data: Category[] }>('/categories')).data.data,
  });
  const paymentMethodsQuery = useQuery({
    queryKey: ['payment-methods'],
    queryFn: async () => (await api.get<{ data: PaymentMethod[] }>('/payment-methods')).data.data,
  });
  const accountsQuery = useQuery({
    queryKey: ['accounts'],
    queryFn: async () => (await api.get<{ data: Account[] }>('/accounts')).data.data,
  });

  const selectedCategoryId = watch('categoryId');
  const selectedPaymentMethodId = watch('paymentMethodId');
  const selectedSubcategoryId = watch('subcategoryId');
  const selectedCategory = categoriesQuery.data?.find((c) => c.id === selectedCategoryId);
  const selectedPaymentMethod = paymentMethodsQuery.data?.find((p) => p.id === selectedPaymentMethodId);
  const filteredCategories = (categoriesQuery.data ?? []).filter((c) => c.type === type);

  useEffect(() => {
    if (selectedCategory && selectedSubcategoryId) {
      const validSubcategory = selectedCategory.subcategories.some((s) => s.id === selectedSubcategoryId);
      if (!validSubcategory) setValue('subcategoryId', '');
    }
  }, [selectedCategory, selectedSubcategoryId, setValue]);

  const mutation = useMutation({
    mutationFn: async (values: FormOutput) => {
      const payload = {
        ...values,
        subcategoryId: values.subcategoryId || undefined,
        paymentMethodId: values.paymentMethodId || undefined,
        accountId: values.accountId || undefined,
        time: values.time || undefined,
      };
      if (editing) return api.patch(`/transactions/${editing.id}`, payload);
      return api.post('/transactions', payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      onClose();
    },
  });

  const onSubmit = (values: FormOutput) => {
    if (selectedPaymentMethod && selectedPaymentMethod.type !== 'cash' && !values.accountId) {
      setError('accountId', { type: 'manual', message: 'Account is required for non-cash payment methods' });
      return;
    }
    mutation.mutate(values);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{editing ? 'Edit Transaction' : 'New Transaction'}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} mt={1}>
          <Controller
            name="type"
            control={control}
            render={({ field }) => (
              <ToggleButtonGroup
                exclusive fullWidth value={field.value}
                onChange={(_, v) => { if (v) { field.onChange(v); setType(v); } }}
              >
                <ToggleButton value="expense" color="error">Expense</ToggleButton>
                <ToggleButton value="income" color="success">Income</ToggleButton>
              </ToggleButtonGroup>
            )}
          />
          <TextField label="Amount" type="number" fullWidth inputProps={{ step: '0.01' }} {...register('amount')} error={!!errors.amount} helperText={errors.amount?.message} />
          <TextField select label="Category" fullWidth {...register('categoryId')} error={!!errors.categoryId} helperText={errors.categoryId?.message} defaultValue={editing?.categoryId ?? ''}>
            {filteredCategories.map((c) => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
          </TextField>
          {selectedCategory && selectedCategory.subcategories.length > 0 && (
            <TextField select label="Subcategory (optional)" fullWidth {...register('subcategoryId')} defaultValue={editing?.subcategoryId ?? ''}>
              <MenuItem value="">None</MenuItem>
              {selectedCategory.subcategories.map((s) => <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>)}
            </TextField>
          )}
          <TextField label="Date" type="date" fullWidth InputLabelProps={{ shrink: true }} {...register('date')} error={!!errors.date} helperText={errors.date?.message} />
          <TextField label="Time (optional)" type="time" fullWidth InputLabelProps={{ shrink: true }} {...register('time')} error={!!errors.time} helperText={errors.time?.message} />
          <TextField select label="Payment Method (optional)" fullWidth {...register('paymentMethodId')} defaultValue={editing?.paymentMethodId ?? ''}>
            <MenuItem value="">None</MenuItem>
            {(paymentMethodsQuery.data ?? []).map((p) => <MenuItem key={p.id} value={p.id}>{p.name}</MenuItem>)}
          </TextField>
          {selectedPaymentMethod && selectedPaymentMethod.type !== 'cash' && (
            <TextField
              select
              label="Account"
              fullWidth
              {...register('accountId')}
              defaultValue={editing?.accountId ?? ''}
              error={!!errors.accountId}
              helperText={errors.accountId?.message ?? 'Choose the bank account used for this payment method.'}
            >
              <MenuItem value="">None</MenuItem>
              {(accountsQuery.data ?? []).map((a) => <MenuItem key={a.id} value={a.id}>{a.name}</MenuItem>)}
            </TextField>
          )}
          <TextField label="Notes (optional)" fullWidth multiline rows={2} {...register('notes')} />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={handleSubmit(onSubmit)} disabled={mutation.isPending}>
          {mutation.isPending ? 'Saving…' : editing ? 'Save Changes' : 'Add Transaction'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
