import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Box, Typography, Button, Grid, Card, CardContent, CardActions, IconButton, Chip, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField, MenuItem, Stack, Accordion, AccordionSummary, AccordionDetails,
  List, ListItem, ListItemText, ListItemSecondaryAction,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import ArchiveIcon from '@mui/icons-material/Archive';
import UnarchiveIcon from '@mui/icons-material/Unarchive';
import DeleteIcon from '@mui/icons-material/Delete';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { api } from '../../api/client';
import type { Category } from '../../types';

export default function CategoriesPage() {
  const queryClient = useQueryClient();
  const [showArchived, setShowArchived] = useState(false);
  const [catDialogOpen, setCatDialogOpen] = useState(false);
  const [editingCat, setEditingCat] = useState<Category | null>(null);
  const [catName, setCatName] = useState('');
  const [catType, setCatType] = useState<'income' | 'expense'>('expense');
  const [subDialogOpen, setSubDialogOpen] = useState(false);
  const [subCategoryId, setSubCategoryId] = useState<string | null>(null);
  const [subName, setSubName] = useState('');

  const categoriesQuery = useQuery({
    queryKey: ['categories', showArchived],
    queryFn: async () => (await api.get<{ data: Category[] }>('/categories', { params: { includeArchived: showArchived } })).data.data,
  });

  const saveCategoryMutation = useMutation({
    mutationFn: async () => {
      if (editingCat) return api.patch(`/categories/${editingCat.id}`, { name: catName, type: catType });
      return api.post('/categories', { name: catName, type: catType });
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['categories'] }); setCatDialogOpen(false); },
  });

  const archiveMutation = useMutation({
    mutationFn: async ({ id, archive }: { id: string; archive: boolean }) =>
      api.patch(`/categories/${id}/${archive ? 'archive' : 'unarchive'}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['categories'] }),
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: async (id: string) => api.delete(`/categories/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['categories'] }),
  });

  const addSubcategoryMutation = useMutation({
    mutationFn: async () => api.post('/subcategories', { name: subName, categoryId: subCategoryId }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['categories'] }); setSubDialogOpen(false); setSubName(''); },
  });

  const deleteSubcategoryMutation = useMutation({
    mutationFn: async (id: string) => api.delete(`/subcategories/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['categories'] }),
  });

  const openNewCategory = () => { setEditingCat(null); setCatName(''); setCatType('expense'); setCatDialogOpen(true); };
  const openEditCategory = (c: Category) => { setEditingCat(c); setCatName(c.name); setCatType(c.type); setCatDialogOpen(true); };

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h5" fontWeight={700}>Categories</Typography>
        <Stack direction="row" spacing={1}>
          <Button variant={showArchived ? 'contained' : 'outlined'} size="small" onClick={() => setShowArchived((v) => !v)}>
            {showArchived ? 'Showing Archived' : 'Show Archived'}
          </Button>
          <Button startIcon={<AddIcon />} variant="contained" onClick={openNewCategory}>Add Category</Button>
        </Stack>
      </Stack>

      <Grid container spacing={2}>
        {(categoriesQuery.data ?? []).map((cat) => (
          <Grid size={{ xs: 12, sm: 6, md: 4 }} key={cat.id}>
            <Card variant="outlined" sx={{ opacity: cat.isArchived ? 0.6 : 1 }}>
              <CardContent>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Typography variant="subtitle1" fontWeight={600}>{cat.name}</Typography>
                  <Chip size="small" label={cat.type} color={cat.type === 'income' ? 'success' : 'default'} />
                </Stack>
                <Accordion elevation={0} sx={{ mt: 1, '&:before': { display: 'none' } }}>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography variant="body2" color="text.secondary">{cat.subcategories.length} subcategories</Typography>
                  </AccordionSummary>
                  <AccordionDetails sx={{ p: 0 }}>
                    <List dense>
                      {cat.subcategories.map((sub) => (
                        <ListItem key={sub.id}>
                          <ListItemText primary={sub.name} />
                          <ListItemSecondaryAction>
                            <IconButton size="small" edge="end" onClick={() => deleteSubcategoryMutation.mutate(sub.id)}>
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </ListItemSecondaryAction>
                        </ListItem>
                      ))}
                    </List>
                    <Button size="small" startIcon={<AddIcon />} sx={{ ml: 1 }} onClick={() => { setSubCategoryId(cat.id); setSubDialogOpen(true); }}>
                      Add subcategory
                    </Button>
                  </AccordionDetails>
                </Accordion>
              </CardContent>
              <CardActions>
                <IconButton size="small" onClick={() => openEditCategory(cat)}><EditIcon fontSize="small" /></IconButton>
                <IconButton size="small" onClick={() => archiveMutation.mutate({ id: cat.id, archive: !cat.isArchived })}>
                  {cat.isArchived ? <UnarchiveIcon fontSize="small" /> : <ArchiveIcon fontSize="small" />}
                </IconButton>
                {!cat.isDefault && (
                  <IconButton size="small" color="error" onClick={() => deleteCategoryMutation.mutate(cat.id)}><DeleteIcon fontSize="small" /></IconButton>
                )}
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Dialog open={catDialogOpen} onClose={() => setCatDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>{editingCat ? 'Edit Category' : 'New Category'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} mt={1}>
            <TextField label="Name" fullWidth value={catName} onChange={(e) => setCatName(e.target.value)} />
            <TextField select label="Type" fullWidth value={catType} onChange={(e) => setCatType(e.target.value as 'income' | 'expense')}>
              <MenuItem value="expense">Expense</MenuItem>
              <MenuItem value="income">Income</MenuItem>
            </TextField>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCatDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={() => saveCategoryMutation.mutate()} disabled={!catName}>Save</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={subDialogOpen} onClose={() => setSubDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>New Subcategory</DialogTitle>
        <DialogContent>
          <TextField label="Name" fullWidth sx={{ mt: 1 }} value={subName} onChange={(e) => setSubName(e.target.value)} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSubDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={() => addSubcategoryMutation.mutate()} disabled={!subName}>Add</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
