import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Box, Typography, Button, Paper, Table, TableHead, TableRow, TableCell, TableBody, TableContainer,
  TablePagination, Checkbox, IconButton, Chip, TextField, MenuItem, Stack, Menu, Dialog, DialogTitle,
  DialogContent, DialogActions, Snackbar,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import DownloadIcon from '@mui/icons-material/Download';
import UploadIcon from '@mui/icons-material/Upload';
import { api } from '../../api/client';
import type { PaginatedResult, Transaction, Category } from '../../types';
import TransactionFormDialog from './TransactionFormDialog';
import TransferDialog from './TransferDialog';

export default function TransactionsPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(0);
  const [limit, setLimit] = useState(20);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [selected, setSelected] = useState<string[]>([]);
  const [formOpen, setFormOpen] = useState(false);
  const [transferOpen, setTransferOpen] = useState(false);
  const [editing, setEditing] = useState<Transaction | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | 'bulk' | null>(null);
  const [exportMenuAnchor, setExportMenuAnchor] = useState<null | HTMLElement>(null);
  const [snackbar, setSnackbar] = useState<string | null>(null);

  const categoriesQuery = useQuery({
    queryKey: ['categories'],
    queryFn: async () => (await api.get<{ data: Category[] }>('/categories')).data.data,
  });

  const transactionsQuery = useQuery({
    queryKey: ['transactions', page, limit, search, typeFilter, categoryFilter],
    queryFn: async () => {
      const params: Record<string, string | number> = { page: page + 1, limit, sortBy: 'date', sortOrder: 'DESC' };
      if (search) params.search = search;
      if (typeFilter) params.type = typeFilter;
      if (categoryFilter) params.categoryId = categoryFilter;
      const { data } = await api.get<{ data: PaginatedResult<Transaction> }>('/transactions', { params });
      return data.data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => api.delete(`/transactions/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      setSnackbar('Transaction deleted');
    },
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: async (ids: string[]) => api.delete('/transactions/bulk', { data: { ids } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      setSelected([]);
      setSnackbar('Transactions deleted');
    },
  });

  const duplicateMutation = useMutation({
    mutationFn: async (id: string) => api.post(`/transactions/${id}/duplicate`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      setSnackbar('Transaction duplicated');
    },
  });

  const rows = transactionsQuery.data?.items ?? [];
  const meta = transactionsQuery.data?.meta;
  const allSelected = rows.length > 0 && rows.every((r) => selected.includes(r.id));

  const toggleAll = () => setSelected(allSelected ? [] : rows.map((r) => r.id));
  const toggleOne = (id: string) => setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const handleExport = async (format: 'csv' | 'excel' | 'pdf') => {
    const response = await api.get('/transactions/export', { params: { format }, responseType: 'blob' });
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.download = `transactions.${format === 'excel' ? 'xlsx' : format}`;
    link.click();
    window.URL.revokeObjectURL(url);
    setExportMenuAnchor(null);
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    const { data } = await api.post('/transactions/import', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
    queryClient.invalidateQueries({ queryKey: ['transactions'] });
    setSnackbar(`Imported ${data.data.imported} transaction(s), ${data.data.failed} failed`);
    e.target.value = '';
  };

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2} flexWrap="wrap" gap={1}>
        <Typography variant="h5" fontWeight={700}>Transactions</Typography>
        <Stack direction="row" spacing={1}>
          <Button component="label" startIcon={<UploadIcon />} variant="outlined">
            Import CSV
            <input type="file" accept=".csv" hidden onChange={handleImport} />
          </Button>
          <Button startIcon={<DownloadIcon />} variant="outlined" onClick={(e) => setExportMenuAnchor(e.currentTarget)}>Export</Button>
          <Menu anchorEl={exportMenuAnchor} open={!!exportMenuAnchor} onClose={() => setExportMenuAnchor(null)}>
            <MenuItem onClick={() => handleExport('csv')}>CSV</MenuItem>
            <MenuItem onClick={() => handleExport('excel')}>Excel</MenuItem>
            <MenuItem onClick={() => handleExport('pdf')}>PDF</MenuItem>
          </Menu>
          <Button variant="outlined" onClick={() => setTransferOpen(true)}>
            Transfer
          </Button>
          <Button startIcon={<AddIcon />} variant="contained" onClick={() => { setEditing(null); setFormOpen(true); }}>
            Add Transaction
          </Button>
        </Stack>
      </Stack>

      <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
        <Stack direction="row" spacing={2} flexWrap="wrap" gap={1}>
          <TextField size="small" label="Search notes/category" value={search} onChange={(e) => { setSearch(e.target.value); setPage(0); }} sx={{ minWidth: 220 }} />
          <TextField size="small" select label="Type" value={typeFilter} onChange={(e) => { setTypeFilter(e.target.value); setPage(0); }} sx={{ minWidth: 140 }}>
            <MenuItem value="">All</MenuItem>
            <MenuItem value="income">Income</MenuItem>
            <MenuItem value="expense">Expense</MenuItem>
          </TextField>
          <TextField size="small" select label="Category" value={categoryFilter} onChange={(e) => { setCategoryFilter(e.target.value); setPage(0); }} sx={{ minWidth: 180 }}>
            <MenuItem value="">All</MenuItem>
            {(categoriesQuery.data ?? []).map((c) => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
          </TextField>
        </Stack>
      </Paper>

      {selected.length > 0 && (
        <Paper sx={{ p: 1, mb: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography variant="body2">{selected.length} selected</Typography>
          <Button size="small" color="error" startIcon={<DeleteIcon />} onClick={() => setDeleteTarget('bulk')}>Delete selected</Button>
        </Paper>
      )}

      <TableContainer component={Paper} variant="outlined">
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell padding="checkbox"><Checkbox checked={allSelected} onChange={toggleAll} /></TableCell>
              <TableCell>Date</TableCell>
              <TableCell>Type</TableCell>
              <TableCell align="right">Amount</TableCell>
              <TableCell align="right">Available</TableCell>
              <TableCell>Category</TableCell>
              <TableCell>Subcategory</TableCell>
              <TableCell>Payment Method</TableCell>
              <TableCell>Notes</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.length === 0 && (
              <TableRow><TableCell colSpan={9} align="center" sx={{ py: 4 }}>
                <Typography color="text.secondary">No transactions found. Add your first one!</Typography>
              </TableCell></TableRow>
            )}
            {rows.map((t) => (
              <TableRow key={t.id} hover selected={selected.includes(t.id)}>
                <TableCell padding="checkbox"><Checkbox checked={selected.includes(t.id)} onChange={() => toggleOne(t.id)} /></TableCell>
                <TableCell>{t.date}</TableCell>
                <TableCell><Chip size="small" label={t.type} color={t.type === 'income' ? 'success' : 'error'} variant="outlined" /></TableCell>
                <TableCell align="right">{Number(t.amount).toFixed(2)}</TableCell>
                <TableCell align="right">{t.availableBalance !== undefined && t.availableBalance !== null ? Number(t.availableBalance).toFixed(2) : '—'}</TableCell>
                <TableCell>{t.category?.name}</TableCell>
                <TableCell>{t.subcategory?.name ?? '—'}</TableCell>
                <TableCell>{t.paymentMethod?.name ?? '—'}</TableCell>
                <TableCell sx={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.notes ?? ''}</TableCell>
                <TableCell align="right">
                  <IconButton size="small" onClick={() => duplicateMutation.mutate(t.id)}><ContentCopyIcon fontSize="small" /></IconButton>
                  <IconButton size="small" onClick={() => { setEditing(t); setFormOpen(true); }}><EditIcon fontSize="small" /></IconButton>
                  <IconButton size="small" color="error" onClick={() => setDeleteTarget(t.id)}><DeleteIcon fontSize="small" /></IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <TablePagination
          component="div"
          count={meta?.totalItems ?? 0}
          page={page}
          onPageChange={(_, p) => setPage(p)}
          rowsPerPage={limit}
          onRowsPerPageChange={(e) => { setLimit(parseInt(e.target.value, 10)); setPage(0); }}
          rowsPerPageOptions={[10, 20, 50, 100]}
        />
      </TableContainer>

      <TransactionFormDialog open={formOpen} onClose={() => setFormOpen(false)} editing={editing} />
      <TransferDialog open={transferOpen} onClose={() => setTransferOpen(false)} />

      <Dialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>
            {deleteTarget === 'bulk' ? `Delete ${selected.length} selected transaction(s)? This cannot be undone.` : 'Delete this transaction? This cannot be undone.'}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteTarget(null)}>Cancel</Button>
          <Button
            color="error" variant="contained"
            onClick={() => {
              if (deleteTarget === 'bulk') bulkDeleteMutation.mutate(selected);
              else if (deleteTarget) deleteMutation.mutate(deleteTarget);
              setDeleteTarget(null);
            }}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={!!snackbar} autoHideDuration={3000} onClose={() => setSnackbar(null)} message={snackbar} />
    </Box>
  );
}
