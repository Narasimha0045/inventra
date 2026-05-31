import React, { useEffect, useState, useCallback } from 'react';
import {
  Box, TableCell, TableRow, IconButton, Tooltip, TextField, Avatar, Typography, alpha,
  Grid, Card, CardContent, useMediaQuery, useTheme,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/DeleteRounded';
import EmailIcon from '@mui/icons-material/EmailRounded';
import PhoneIcon from '@mui/icons-material/PhoneRounded';
import { useSnackbar } from 'notistack';
import { useAppContext } from '../context/AppContext';
import PageHeader from '../components/PageHeader';
import DataTable from '../components/DataTable';
import SearchBar from '../components/SearchBar';
import ConfirmDialog from '../components/ConfirmDialog';
import FormModal from '../components/FormModal';
import Button from '@mui/material/Button';
import UploadFileIcon from '@mui/icons-material/UploadFile';

const columns = [
  { field: 'full_name', headerName: 'Customer' },
  { field: 'email', headerName: 'Email' },
  { field: 'phone', headerName: 'Phone', width: 150 },
  { field: 'created_at', headerName: 'Joined', width: 130 },
  { field: 'actions', headerName: '', width: 80 },
];

const AVATAR_COLORS = ['#6366f1', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#ec4899'];

function getAvatarColor(name) {
  let hash = 0;
  for (let i = 0; i < (name || '').length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function getInitials(name) {
  if (!name) return '?';
  const parts = name.split(' ');
  return parts.length > 1 ? `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase() : name[0].toUpperCase();
}

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' });
}

const emptyForm = { full_name: '', email: '', phone: '' };

export default function CustomersPage() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { enqueueSnackbar } = useSnackbar();
  const { customers, loading, fetchCustomers, createCustomer, deleteCustomer } = useAppContext();

  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  const handleSearch = useCallback((value) => {
    setSearch(value);
    fetchCustomers(value);
  }, [fetchCustomers]);

  const handleSubmit = async () => {
    if (!form.full_name || !form.email) {
      enqueueSnackbar('Please fill in all required fields', { variant: 'warning' });
      return;
    }
    setSubmitting(true);
    try {
      await createCustomer(form);
      enqueueSnackbar('Customer created successfully', { variant: 'success' });
      setModalOpen(false);
      setForm(emptyForm);
    } catch (err) {
      enqueueSnackbar(err.message, { variant: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    try {
      await deleteCustomer(customerToDelete.id);
      enqueueSnackbar('Customer deleted successfully', { variant: 'success' });
    } catch (err) {
      enqueueSnackbar(err.message, { variant: 'error' });
    }
    setDeleteDialogOpen(false);
    setCustomerToDelete(null);
  };
  const handleImportCustomers = async (event) => {
    const file = event.target.files[0];

    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      setUploading(true);

      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/customers/import`,
        {
          method: 'POST',
          body: formData,
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.detail || 'Import failed');
      }

      enqueueSnackbar(
        `Imported ${result.data.imported} customers, Skipped ${result.data.skipped}`,
        { variant: 'success' }
      );

      fetchCustomers();
    } catch (error) {
      enqueueSnackbar(error.message || 'Import failed', {
        variant: 'error',
      });
    } finally {
      setUploading(false);
      event.target.value = '';
    }
  };

  function renderModals() {
    return (
      <>
        <FormModal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          onSubmit={handleSubmit}
          title="Add New Customer"
          submitLabel="Create"
          loading={submitting}
        >
          <TextField
            id="customer-name"
            label="Full Name"
            value={form.full_name}
            onChange={(e) => setForm({ ...form, full_name: e.target.value })}
            fullWidth
            required
            autoFocus
          />
          <TextField
            id="customer-email"
            label="Email Address"
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            fullWidth
            required
          />
          <TextField
            id="customer-phone"
            label="Phone Number"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            fullWidth
          />
        </FormModal>
        <ConfirmDialog
          open={deleteDialogOpen}
          onClose={() => setDeleteDialogOpen(false)}
          onConfirm={handleDelete}
          title="Delete Customer"
          message={`Are you sure you want to delete "${customerToDelete?.full_name}"? All associated orders will also be deleted.`}
        />
      </>
    );
  }

  // Mobile card view
  if (isMobile) {
    return (
      <Box>
        <PageHeader title="Customers" subtitle="Manage your customer relationships" actionLabel="Add Customer" onAction={() => { setForm(emptyForm); setModalOpen(true); }} />
        <Box sx={{ mb: 3 }}>
          <SearchBar value={search} onChange={handleSearch} placeholder="Search customers..." />
          <Button component="label" variant="outlined" startIcon={<UploadFileIcon />} disabled={uploading}>
            {uploading ? 'Uploading...' : 'Import CSV'}
            <input hidden type="file" accept=".csv" onChange={handleImportCustomers} />
          </Button>
          <Button
            variant="text"
            href="/customers_template.csv"
            download
          >
            Download Template
          </Button>
        </Box>
        <Grid container spacing={2}>
          {customers.map((c) => {
            const color = getAvatarColor(c.full_name);
            return (
              <Grid item xs={12} sm={6} key={c.id}>
                <Card>
                  <CardContent sx={{ p: 2.5 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1.5 }}>
                      <Avatar sx={{ bgcolor: alpha(color, 0.15), color, fontWeight: 700, width: 44, height: 44 }}>
                        {getInitials(c.full_name)}
                      </Avatar>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>{c.full_name}</Typography>
                        <Typography variant="caption" color="text.secondary">{c.email}</Typography>
                      </Box>
                      <IconButton size="small" color="error" onClick={() => { setCustomerToDelete(c); setDeleteDialogOpen(true); }}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Box>
                    {c.phone && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <PhoneIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
                        <Typography variant="caption" color="text.secondary">{c.phone}</Typography>
                      </Box>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>
        {renderModals()}
      </Box>
    );
  }

  return (
    <Box>
      <PageHeader title="Customers" subtitle="Manage your customer relationships" actionLabel="Add Customer" onAction={() => { setForm(emptyForm); setModalOpen(true); }} />
      <Box sx={{ mb: 3 , display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
        <SearchBar value={search} onChange={handleSearch} placeholder="Search customers..." />
        <Button component="label" variant="outlined" startIcon={<UploadFileIcon />} disabled={uploading}>
          {uploading ? 'Uploading...' : 'Import CSV'}
          <input hidden type="file" accept=".csv" onChange={handleImportCustomers} />
        </Button>
        <Button variant="text" href="/customers_template.csv" download>
          Download Template
        </Button>
      </Box>
      <DataTable
        columns={columns}
        rows={customers}
        loading={loading.customers}
        emptyMessage="No customers found"
        renderRow={(customer) => {
          const color = getAvatarColor(customer.full_name);
          return (
            <TableRow key={customer.id} hover>
              <TableCell>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <Avatar sx={{ bgcolor: alpha(color, 0.12), color, fontWeight: 700, width: 36, height: 36, fontSize: '0.85rem' }}>
                    {getInitials(customer.full_name)}
                  </Avatar>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>{customer.full_name}</Typography>
                </Box>
              </TableCell>
              <TableCell>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <EmailIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
                  <Typography variant="body2">{customer.email}</Typography>
                </Box>
              </TableCell>
              <TableCell>
                <Typography variant="body2" color="text.secondary">{customer.phone || 'ΓÇö'}</Typography>
              </TableCell>
              <TableCell>
                <Typography variant="body2" color="text.secondary">{formatDate(customer.created_at)}</Typography>
              </TableCell>
              <TableCell align="right">
                <Tooltip title="Delete">
                  <IconButton
                    size="small"
                    onClick={() => { setCustomerToDelete(customer); setDeleteDialogOpen(true); }}
                    sx={{ color: 'text.secondary', '&:hover': { color: 'error.main' } }}
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </TableCell>
            </TableRow>
          );
        }}
      />
      {renderModals()}
    </Box>
  );
}
