import { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, MenuItem, Stack, ToggleButtonGroup, ToggleButton, Typography,
} from '@mui/material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { api } from '../../api/client';
import type { Category, PaymentMethod, Account, Transaction } from '../../types';

const schema = z.object({
  type: z.enum(['income', 'expense']),
  amount: z.coerce.number().positive('Amount must be greater than 0'),
  categoryId: z.string().uuid('Select a category').optional(),
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
  const [mode, setMode] = useState<'income' | 'expense' | 'transfer'>(editing ? (editing.category?.name === 'Transfer' ? 'transfer' : (editing.type ?? 'expense')) : 'expense');

  const [fromMode, setFromMode] = useState<'cash' | 'account' | 'external'>('cash');
  const [toMode, setToMode] = useState<'cash' | 'account' | 'external'>('account');
  const [fromAccountIdState, setFromAccountIdState] = useState<string | ''>('');
  const [toAccountIdState, setToAccountIdState] = useState<string | ''>('');

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
      // reset transfer modes when opening
      // default: from cash -> to account
      // if editing and appears like transfer, try to infer
      ...(editing && editing.category?.name === 'Transfer' ? { } : {}),
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
      if (mode === 'transfer') {
        // build transfer payload from transfer-specific state
        const fromAccountId = fromMode === 'account' ? (fromAccountIdState || null) : (fromMode === 'cash' ? null : null);
        const toAccountId = toMode === 'account' ? (toAccountIdState || null) : (toMode === 'cash' ? null : null);
        const payload = {
          fromAccountId: fromAccountId ?? null,
          toAccountId: toAccountId ?? null,
          amount: values.amount,
          date: values.date,
          notes: values.notes || undefined,
          external: fromMode === 'external' || toMode === 'external',
        } as const;
        // If editing an existing transaction and converting to transfer, create transfer then delete original
        const res = await api.post('/transactions/transfer', payload);
        if (editing) await api.delete(`/transactions/${editing.id}`);
        return res;
      }
      const payload = {
        ...values,
        subcategoryId: values.subcategoryId || null,
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
    if ((mode as any) === 'transfer') {
      if (fromMode === 'account' && !fromAccountIdState) { setError('accountId', { type: 'manual', message: 'Select source account' }); return; }
      if (toMode === 'account' && !toAccountIdState) { setError('accountId', { type: 'manual', message: 'Select destination account' }); return; }
      // prevent same account
      if (fromMode === 'account' && toMode === 'account' && fromAccountIdState && toAccountIdState && fromAccountIdState === toAccountIdState) {
        setError('accountId', { type: 'manual', message: 'Source and destination must differ' });
        return;
      }
      mutation.mutate(values);
      return;
    }
    if (selectedPaymentMethod && selectedPaymentMethod.type !== 'cash' && !values.accountId) {
      setError('accountId', { type: 'manual', message: 'Account is required for non-cash payment methods' });
      return;
    }
    if (mode === 'transfer') {
      // transfer handled above
    } else {
      if (!values.categoryId) {
        setError('categoryId', { type: 'manual', message: 'Category is required' });
        return;
      }
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
                onChange={(_, v) => { if (v) { field.onChange(v); setType(v); setMode(v); } }}
              >
                <ToggleButton value="expense" color="error">Expense</ToggleButton>
                <ToggleButton value="income" color="success">Income</ToggleButton>
              </ToggleButtonGroup>
            )}
          />
          <ToggleButtonGroup
            exclusive fullWidth value={mode}
            onChange={(_, v) => { if (v) { setMode(v); if (v === 'income' || v === 'expense') setType(v); } }}
          >
            <ToggleButton value="expense" color="error">Expense</ToggleButton>
            <ToggleButton value="income" color="success">Income</ToggleButton>
            <ToggleButton value="transfer">Transfer</ToggleButton>
          </ToggleButtonGroup>
          <TextField label="Amount" type="number" fullWidth inputProps={{ step: '0.01' }} {...register('amount')} error={!!errors.amount} helperText={errors.amount?.message} />
          <Controller
            name="categoryId"
            control={control}
            defaultValue={editing?.categoryId ?? ''}
            render={({ field }) => (
              <TextField
                select
                label="Category"
                fullWidth
                {...field}
                error={!!errors.categoryId}
                helperText={errors.categoryId?.message}
                onChange={(event) => {
                  field.onChange(event);
                  const nextCategoryId = event.target.value;
                  const nextCategory = categoriesQuery.data?.find((c) => c.id === nextCategoryId);
                  if (nextCategory && selectedSubcategoryId) {
                    const validSubcategory = nextCategory.subcategories.some((s) => s.id === selectedSubcategoryId);
                    if (!validSubcategory) setValue('subcategoryId', '');
                  }
                }}
              >
                {filteredCategories.map((c) => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
              </TextField>
            )}
          />
          {selectedCategory && selectedCategory.subcategories.length > 0 && (
            <Controller
              name="subcategoryId"
              control={control}
              defaultValue={editing?.subcategoryId ?? ''}
              render={({ field }) => (
                <TextField select label="Subcategory (optional)" fullWidth {...field}>
                  <MenuItem value="">None</MenuItem>
                  {selectedCategory.subcategories.map((s) => <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>)}
                </TextField>
              )}
            />
          )}
          <TextField label="Date" type="date" fullWidth InputLabelProps={{ shrink: true }} {...register('date')} error={!!errors.date} helperText={errors.date?.message} />
          <TextField label="Time (optional)" type="time" fullWidth InputLabelProps={{ shrink: true }} {...register('time')} error={!!errors.time} helperText={errors.time?.message} />
          <Controller
            name="paymentMethodId"
            control={control}
            defaultValue={editing?.paymentMethodId ?? ''}
            render={({ field }) => (
              <TextField select label="Payment Method (optional)" fullWidth {...field}>
                <MenuItem value="">None</MenuItem>
                {(paymentMethodsQuery.data ?? []).map((p) => <MenuItem key={p.id} value={p.id}>{p.name}</MenuItem>)}
              </TextField>
            )}
          />
          {selectedPaymentMethod && selectedPaymentMethod.type !== 'cash' && (
            <Controller
              name="accountId"
              control={control}
              defaultValue={editing?.accountId ?? ''}
              render={({ field }) => (
                <TextField
                  select
                  label="Account"
                  fullWidth
                  {...field}
                  error={!!errors.accountId}
                  helperText={errors.accountId?.message ?? 'Choose the bank account used for this payment method.'}
                >
                  <MenuItem value="">None</MenuItem>
                  {(accountsQuery.data ?? []).map((a) => <MenuItem key={a.id} value={a.id}>{a.name}</MenuItem>)}
                </TextField>
              )}
            />
          )}
          {mode === 'transfer' && (
            <Stack spacing={1}>
              <Typography variant="subtitle2">From</Typography>
              <TextField select label="Source" fullWidth value={fromMode} onChange={(e) => setFromMode(e.target.value as any)}>
                <MenuItem value="cash">Cash</MenuItem>
                <MenuItem value="account">Account</MenuItem>
                <MenuItem value="external">Out of wallet</MenuItem>
              </TextField>
              {fromMode === 'account' && (
                (accountsQuery.data ?? []).length === 0 ? (
                  <Typography color="warning.main">No accounts available. Add a bank/account to transfer from.</Typography>
                ) : (
                  <TextField select label="From Account" fullWidth value={fromAccountIdState} onChange={(e) => setFromAccountIdState(e.target.value)}>
                    <MenuItem value="">Select account</MenuItem>
                    {(accountsQuery.data ?? []).map((a) => <MenuItem key={a.id} value={a.id}>{a.name}</MenuItem>)}
                  </TextField>
                )
              )}

              <Typography variant="subtitle2">To</Typography>
              <TextField select label="Destination" fullWidth value={toMode} onChange={(e) => setToMode(e.target.value as any)}>
                <MenuItem value="cash">Cash</MenuItem>
                <MenuItem value="account">Account</MenuItem>
                <MenuItem value="external">Out of wallet</MenuItem>
              </TextField>
              {toMode === 'account' && (
                (accountsQuery.data ?? []).length === 0 ? (
                  <Typography color="warning.main">No accounts available. Add a bank/account to transfer to.</Typography>
                ) : (
                  <TextField select label="To Account" fullWidth value={toAccountIdState} onChange={(e) => setToAccountIdState(e.target.value)}>
                    <MenuItem value="">Select account</MenuItem>
                    {(accountsQuery.data ?? []).map((a) => <MenuItem key={a.id} value={a.id}>{a.name}</MenuItem>)}
                  </TextField>
                )
              )}
            </Stack>
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
