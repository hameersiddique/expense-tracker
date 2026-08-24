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

type Mode = 'income' | 'expense' | 'transfer';
// One side of a transfer: cash on hand, a specific bank/account, or money leaving/entering
// the tracked wallet entirely (e.g. gift given out, cash found, external payment).
type TransferSide = 'cash' | 'account' | 'external';

// NOTE: these two type-guesses assume the API returns transfer transactions with
// `fromAccountId` / `toAccountId` / `external` fields (mirroring the payload shape
// posted to /transactions/transfer below), and flags a transfer either via
// `editing.category?.name === 'Transfer'` or an explicit `editing.type === 'transfer'`.
// Adjust these two checks if your actual Transaction/transfer shape differs.
function isTransferTransaction(t: Transaction | null): boolean {
  if (!t) return false;
  return (t as any).type === 'transfer' || t.category?.name === 'Transfer';
}

function sideFromAccountId(accountId: string | null | undefined, external: boolean | undefined): TransferSide {
  if (accountId) return 'account';
  if (external) return 'external';
  return 'cash';
}

export default function TransactionFormDialog({
  open, onClose, editing,
}: { open: boolean; onClose: () => void; editing: Transaction | null }) {
  const queryClient = useQueryClient();

  const initialMode: Mode = editing
    ? (isTransferTransaction(editing) ? 'transfer' : (editing.type ?? 'expense'))
    : 'expense';

  const [mode, setMode] = useState<Mode>(initialMode);
  const [type, setType] = useState<'income' | 'expense'>(editing?.type === 'income' ? 'income' : 'expense');

  const [fromMode, setFromMode] = useState<TransferSide>('cash');
  const [toMode, setToMode] = useState<TransferSide>('account');
  const [fromAccountIdState, setFromAccountIdState] = useState<string | ''>('');
  const [toAccountIdState, setToAccountIdState] = useState<string | ''>('');

  const { control, register, handleSubmit, watch, reset, setError, setValue, clearErrors, formState: { errors } } = useForm<FormValues, any, FormOutput>({
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
    if (!open) return;

    const nextMode: Mode = editing
      ? (isTransferTransaction(editing) ? 'transfer' : (editing.type ?? 'expense'))
      : 'expense';
    setMode(nextMode);
    setType(editing?.type === 'income' ? 'income' : 'expense');

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

    if (nextMode === 'transfer' && editing) {
      const e = editing as any;
      const derivedFromMode = sideFromAccountId(e.fromAccountId, e.external && !e.fromAccountId);
      setFromMode(derivedFromMode === 'external' ? 'cash' : derivedFromMode);
      setToMode(sideFromAccountId(e.toAccountId, e.external && !e.toAccountId));
      setFromAccountIdState(e.fromAccountId ?? '');
      setToAccountIdState(e.toAccountId ?? '');
    } else {
      setFromMode('cash');
      setToMode('account');
      setFromAccountIdState('');
      setToAccountIdState('');
    }
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
  const hasAccounts = (accountsQuery.data ?? []).length > 0;

  const selectedCategoryId = watch('categoryId');
  const selectedPaymentMethodId = watch('paymentMethodId');
  const selectedSubcategoryId = watch('subcategoryId');
  const selectedCategory = categoriesQuery.data?.find((c) => c.id === selectedCategoryId);
  const selectedPaymentMethod = paymentMethodsQuery.data?.find((p) => p.id === selectedPaymentMethodId);
  const filteredCategories = (categoriesQuery.data ?? []).filter((c) => c.type === type);

  // Income doesn't need a parent-category step: the subcategories under the
  // income category/categories ARE the sources of income (Salary, Freelancing,
  // Rental Income, etc). Flatten them into one list, remembering each one's
  // parent categoryId so we can still populate categoryId on save.
  const incomeSources = (categoriesQuery.data ?? [])
    .filter((c) => c.type === 'income')
    .flatMap((c) => c.subcategories.map((s) => ({ ...s, categoryId: c.id })));

  useEffect(() => {
    if (selectedCategory && selectedSubcategoryId) {
      const validSubcategory = selectedCategory.subcategories.some((s) => s.id === selectedSubcategoryId);
      if (!validSubcategory) setValue('subcategoryId', '');
    }
  }, [selectedCategory, selectedSubcategoryId, setValue]);

  // If a side switches away from "account", drop its stale account id.
  useEffect(() => {
    if (fromMode !== 'account') setFromAccountIdState('');
  }, [fromMode]);
  useEffect(() => {
    if (toMode !== 'account') setToAccountIdState('');
  }, [toMode]);

  const mutation = useMutation({
    mutationFn: async (values: FormOutput) => {
      if (mode === 'transfer') {
        const fromAccountId = fromMode === 'account' ? fromAccountIdState : null;
        const toAccountId = toMode === 'account' ? toAccountIdState : null;
        const payload = {
          fromAccountId: fromAccountId || null,
          toAccountId: toAccountId || null,
          amount: values.amount,
          date: values.date,
          notes: values.notes || undefined,
          external: fromMode === 'external' || toMode === 'external',
        } as const;

        if (editing && isTransferTransaction(editing)) {
          // Already a transfer, still a transfer: update in place.
          // NOTE: assumes a PATCH /transactions/transfer/:id endpoint exists;
          // swap this for whatever your API actually exposes.
          return api.patch(`/transactions/transfer/${editing.id}`, payload);
        }
        // New transfer, or converting an income/expense row into a transfer:
        // create the transfer, then remove the original row if we were editing one.
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
      if (editing && !isTransferTransaction(editing)) return api.patch(`/transactions/${editing.id}`, payload);
      if (editing && isTransferTransaction(editing)) {
        // Converting a transfer into a plain income/expense row.
        const res = await api.post('/transactions', payload);
        await api.delete(`/transactions/${editing.id}`);
        return res;
      }
      return api.post('/transactions', payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      onClose();
    },
  });

  const onSubmit = (values: FormOutput) => {
    clearErrors();

    if (mode === 'transfer') {
      if (fromMode === 'account' && !fromAccountIdState) { setError('root', { type: 'manual', message: 'Select the source bank account' }); return; }
      if (toMode === 'account' && !toAccountIdState) { setError('root', { type: 'manual', message: 'Select the destination bank account' }); return; }
      if (fromMode === 'account' && toMode === 'account' && fromAccountIdState === toAccountIdState) {
        setError('root', { type: 'manual', message: 'Source and destination accounts must differ' });
        return;
      }
      if (fromMode === 'cash' && toMode === 'cash') {
        setError('root', { type: 'manual', message: 'Choose at least one bank account, or "out of wallet", on one side' });
        return;
      }
      mutation.mutate(values);
      return;
    }

    // income / expense
    if (!values.categoryId) {
      setError('categoryId', { type: 'manual', message: mode === 'income' ? 'Select a source of income' : 'Category is required' });
      return;
    }
    if (selectedPaymentMethod && selectedPaymentMethod.type !== 'cash' && !values.accountId) {
      setError('accountId', { type: 'manual', message: 'Account is required for non-cash payment methods' });
      return;
    }
    mutation.mutate(values);
  };

  const renderSideBankPicker = (
    side: 'from' | 'to',
    sideMode: TransferSide,
    accountId: string,
    setAccountId: (v: string) => void,
  ) => {
    if (sideMode !== 'account') return null;
    if (!hasAccounts) {
      return (
        <Typography variant="body2" color="warning.main">
          You don't have any bank accounts yet. Add a bank account first if you want to transfer {side === 'from' ? 'from' : 'to'} one.
        </Typography>
      );
    }
    return (
      <TextField
        select
        label="Which bank?"
        fullWidth
        value={accountId}
        onChange={(e) => setAccountId(e.target.value)}
      >
        <MenuItem value="">Select a bank</MenuItem>
        {(accountsQuery.data ?? []).map((a) => <MenuItem key={a.id} value={a.id}>{a.name}</MenuItem>)}
      </TextField>
    );
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{editing ? 'Edit Transaction' : 'New Transaction'}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} mt={1}>
          <ToggleButtonGroup
            exclusive
            fullWidth
            value={mode}
            onChange={(_, v: Mode | null) => {
              if (!v) return;
              setMode(v);
              clearErrors();
              if (v === 'income' || v === 'expense') {
                setType(v);
                setValue('type', v);
              }
              if (v === 'transfer' && fromMode === 'external') setFromMode('cash');
            }}
          >
            <ToggleButton value="expense" color="error">Expense</ToggleButton>
            <ToggleButton value="income" color="success">Income</ToggleButton>
            <ToggleButton value="transfer">Transfer</ToggleButton>
          </ToggleButtonGroup>

          <TextField
            label="Amount"
            type="number"
            fullWidth
            inputProps={{ step: '0.01' }}
            {...register('amount')}
            error={!!errors.amount}
            helperText={errors.amount?.message}
          />

          {mode === 'expense' && (
            <>
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
            </>
          )}

          {mode === 'income' && (
            <Controller
              name="subcategoryId"
              control={control}
              defaultValue={editing?.subcategoryId ?? ''}
              render={({ field }) => (
                <TextField
                  select
                  label="Source of income"
                  fullWidth
                  {...field}
                  error={!!errors.categoryId}
                  helperText={errors.categoryId?.message}
                  onChange={(event) => {
                    field.onChange(event);
                    const sourceId = event.target.value;
                    const source = incomeSources.find((s) => s.id === sourceId);
                    setValue('categoryId', source?.categoryId ?? '');
                  }}
                >
                  {incomeSources.map((s) => <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>)}
                </TextField>
              )}
            />
          )}

          {mode !== 'transfer' && (
            <>
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
            </>
          )}

          {mode === 'transfer' && (
            <Stack spacing={1}>
              <TextField select label="From" fullWidth value={fromMode} onChange={(e) => setFromMode(e.target.value as TransferSide)}>
                <MenuItem value="cash">Cash</MenuItem>
                <MenuItem value="account">Bank</MenuItem>
              </TextField>
              {renderSideBankPicker('from', fromMode, fromAccountIdState, setFromAccountIdState)}

              <TextField select label="To" fullWidth value={toMode} onChange={(e) => setToMode(e.target.value as TransferSide)}>
                <MenuItem value="cash">Cash</MenuItem>
                <MenuItem value="account">Bank</MenuItem>
                <MenuItem value="external">Out of wallet</MenuItem>
              </TextField>
              {renderSideBankPicker('to', toMode, toAccountIdState, setToAccountIdState)}

              {(errors as any).root?.message && (
                <Typography variant="body2" color="error">{(errors as any).root.message}</Typography>
              )}
            </Stack>
          )}

          <TextField label="Date" type="date" fullWidth InputLabelProps={{ shrink: true }} {...register('date')} error={!!errors.date} helperText={errors.date?.message} />
          <TextField label="Time (optional)" type="time" fullWidth InputLabelProps={{ shrink: true }} {...register('time')} error={!!errors.time} helperText={errors.time?.message} />
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