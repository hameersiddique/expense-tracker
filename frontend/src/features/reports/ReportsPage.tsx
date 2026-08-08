import { useState } from 'react';
import { Box, Typography, Paper, TextField, MenuItem, Button, Stack, Grid } from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import { api } from '../../api/client';

const PERIODS = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'quarterly', label: 'Quarterly' },
  { value: 'yearly', label: 'Yearly' },
  { value: 'custom', label: 'Custom Date Range' },
];

export default function ReportsPage() {
  const [period, setPeriod] = useState('monthly');
  const [format, setFormat] = useState<'pdf' | 'excel' | 'csv'>('pdf');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [loading, setLoading] = useState(false);

  const generate = async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = { period, format };
      if (period === 'custom') { params.dateFrom = dateFrom; params.dateTo = dateTo; }
      const response = await api.get('/reports/generate', { params, responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.download = `report-${period}.${format === 'excel' ? 'xlsx' : format}`;
      link.click();
      window.URL.revokeObjectURL(url);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      <Typography variant="h5" fontWeight={700} mb={2}>Reports</Typography>
      <Paper variant="outlined" sx={{ p: 3, maxWidth: 520 }}>
        <Stack spacing={2}>
          <TextField select label="Period" value={period} onChange={(e) => setPeriod(e.target.value)}>
            {PERIODS.map((p) => <MenuItem key={p.value} value={p.value}>{p.label}</MenuItem>)}
          </TextField>
          {period === 'custom' && (
            <Grid container spacing={2}>
              <Grid size={{ xs: 6 }}>
                <TextField label="From" type="date" fullWidth InputLabelProps={{ shrink: true }} value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
              </Grid>
              <Grid size={{ xs: 6 }}>
                <TextField label="To" type="date" fullWidth InputLabelProps={{ shrink: true }} value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
              </Grid>
            </Grid>
          )}
          <TextField select label="Format" value={format} onChange={(e) => setFormat(e.target.value as 'pdf' | 'excel' | 'csv')}>
            <MenuItem value="pdf">PDF</MenuItem>
            <MenuItem value="excel">Excel</MenuItem>
            <MenuItem value="csv">CSV</MenuItem>
          </TextField>
          <Button variant="contained" startIcon={<DownloadIcon />} onClick={generate} disabled={loading || (period === 'custom' && (!dateFrom || !dateTo))}>
            {loading ? 'Generating…' : 'Generate Report'}
          </Button>
        </Stack>
      </Paper>
    </Box>
  );
}
