import React, { useEffect, useState, useCallback } from 'react';
import {
  Box, TableCell, TableRow, Chip, IconButton, Tooltip, TextField,
  useMediaQuery, useTheme, Grid, Card, CardContent, Typography, alpha,
} from '@mui/material';
import EditIcon from '@mui/icons-material/EditRounded';
import DeleteIcon from '@mui/icons-material/DeleteRounded';
import { useSnackbar } from 'notistack';
import { useAppContext } from '../context/AppContext';
import PageHeader from '../components/PageHeader';
import DataTable from '../components/DataTable';
import SearchBar from '../components/SearchBar';
import ConfirmDialog from '../components/ConfirmDialog';
import FormModal from '../components/FormModal';
import Button from '@mui/material/Button';
import UploadFileIcon from '@mui/icons-material/UploadFile';

function getStockBadge(qty) {
  if (qty === 0) return <Chip label="Out of Stock" size="small" sx={{ bgcolor: '#fef2f2', color: '#dc2626', fontWeight: 600 }} />;
  if (qty <= 5) return <Chip label="Low Stock" size="small" sx={{ bgcolor: '#fffbeb', color: '#d97706', fontWeight: 600 }} />;
  return <Chip label="In Stock" size="small" sx={{ bgcolor: '#f0fdf4', color: '#16a34a', fontWeight: 600 }} />;
}

function formatCurrency(val) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(val || 0);
}

const columns = [
  { field: 'name', headerName: 'Product' },
  { field: 'sku', headerName: 'SKU' },
  { field: 'price', headerName: 'Price', width: 120 },
  { field: 'quantity_in_stock', headerName: 'Stock', width: 100 },
  { field: 'status', headerName: 'Status', width: 120 },
  { field: 'actions', headerName: '', width: 100 },
];

const emptyForm = { name: '', sku: '', price: '', quantity_in_stock: '' };

export default function ProductsPage() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { enqueueSnackbar } = useSnackbar();
  const { products, loading, fetchProducts, createProduct, updateProduct, deleteProduct } = useAppContext();

  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleSearch = useCallback((value) => {
    setSearch(value);
    fetchProducts(value);
  }, [fetchProducts]);

  const handleOpenCreate = () => {
    setEditingProduct(null);
    setForm(emptyForm);
    setModalOpen(true);
  };

  const handleOpenEdit = (product) => {
    setEditingProduct(product);
    setForm({
      name: product.name,
      sku: product.sku,
      price: String(product.price),
      quantity_in_stock: String(product.quantity_in_stock),
    });
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    if (!form.name || !form.sku || !form.price || form.quantity_in_stock === '') {
      enqueueSnackbar('Please fill in all required fields', { variant: 'warning' });
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        name: form.name,
        sku: form.sku,
        price: parseFloat(form.price),
        quantity_in_stock: parseInt(form.quantity_in_stock, 10),
      };
      if (editingProduct) {
        await updateProduct(editingProduct.id, payload);
        enqueueSnackbar('Product updated successfully', { variant: 'success' });
      } else {
        await createProduct(payload);
        enqueueSnackbar('Product created successfully', { variant: 'success' });
      }
      setModalOpen(false);
    } catch (err) {
      enqueueSnackbar(err.message, { variant: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    try {
      await deleteProduct(productToDelete.id);
      enqueueSnackbar('Product deleted successfully', { variant: 'success' });
    } catch (err) {
      enqueueSnackbar(err.message, { variant: 'error' });
    }
    setDeleteDialogOpen(false);
    setProductToDelete(null);
  };

  const handleImportProducts = async (event) => {
    const file = event.target.files[0];

    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      setUploading(true);

      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/products/import`,
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
        `Imported ${result.data.imported} products, Skipped ${result.data.skipped}`,
        { variant: 'success' }
      );

      fetchProducts();
    } catch (error) {
      enqueueSnackbar(error.message || 'Import failed', {
        variant: 'error',
      });
    } finally {
      setUploading(false);
      event.target.value = '';
    }
  };

  // Mobile card view
  if (isMobile) {
    return (
      <Box>
        <PageHeader title="Products" subtitle="Manage your product inventory" actionLabel="Add Product" onAction={handleOpenCreate} />
        <Box sx={{ mb: 3 , display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
          <SearchBar value={search} onChange={handleSearch} placeholder="Search products..." />
          <Button component="label" variant="outlined" startIcon={<UploadFileIcon />} disabled={uploading}>
            {uploading ? 'Uploading...' : 'Import CSV'}
            <input hidden type="file" accept=".csv" onChange={handleImportProducts} />
          </Button>
          <Button variant="text" href="/products_template.csv" download>
            Download Template
          </Button>
        </Box>
        <Grid container spacing={2}>
          {products.map((p) => (
            <Grid item xs={12} sm={6} key={p.id}>
              <Card>
                <CardContent sx={{ p: 2.5 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5 }}>
                    <Box>
                      <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'text.primary' }}>
                        {p.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">{p.sku}</Typography>
                    </Box>
                    {getStockBadge(p.quantity_in_stock)}
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box>
                      <Typography variant="h6" sx={{ fontWeight: 700, color: 'primary.main' }}>
                        {formatCurrency(p.price)}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {p.quantity_in_stock} in stock
                      </Typography>
                    </Box>
                    <Box>
                      <IconButton size="small" onClick={() => handleOpenEdit(p)}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton size="small" color="error" onClick={() => { setProductToDelete(p); setDeleteDialogOpen(true); }}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
        {renderModals()}
      </Box>
    );
  }

  function renderModals() {
    return (
      <>
        <FormModal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          onSubmit={handleSubmit}
          title={editingProduct ? 'Edit Product' : 'Add New Product'}
          submitLabel={editingProduct ? 'Update' : 'Create'}
          loading={submitting}
        >
          <TextField
            id="product-name"
            label="Product Name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            fullWidth
            required
            autoFocus
          />
          <TextField
            id="product-sku"
            label="SKU"
            value={form.sku}
            onChange={(e) => setForm({ ...form, sku: e.target.value })}
            fullWidth
            required
          />
          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField
              id="product-price"
              label="Price"
              type="number"
              value={form.price}
              onChange={(e) => setForm({ ...form, price: e.target.value })}
              fullWidth
              required
              inputProps={{ min: 0, step: '0.01' }}
            />
            <TextField
              id="product-stock"
              label="Stock Quantity"
              type="number"
              value={form.quantity_in_stock}
              onChange={(e) => setForm({ ...form, quantity_in_stock: e.target.value })}
              fullWidth
              required
              inputProps={{ min: 0 }}
            />
          </Box>
        </FormModal>
        <ConfirmDialog
          open={deleteDialogOpen}
          onClose={() => setDeleteDialogOpen(false)}
          onConfirm={handleDelete}
          title="Delete Product"
          message={`Are you sure you want to delete "${productToDelete?.name}"? This action cannot be undone.`}
        />
      </>
    );
  }

  return (
    <Box>
      <PageHeader title="Products" subtitle="Manage your product inventory" actionLabel="Add Product" onAction={handleOpenCreate} />
      <Box sx={{ mb: 3, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        <SearchBar value={search} onChange={handleSearch} placeholder="Search products..." />

        <Button component="label" variant="outlined" startIcon={<UploadFileIcon />} disabled={uploading}>
          {uploading ? 'Uploading...' : 'Import CSV'}
          <input hidden type="file" accept=".csv" onChange={handleImportProducts} />
        </Button>
        <Button href="/products_template.csv" variant="text">
          Download Template
        </Button>
      </Box>
      <DataTable
        columns={columns}
        rows={products}
        loading={loading.products}
        emptyMessage="No products found"
        renderRow={(product) => (
          <TableRow key={product.id} hover>
            <TableCell>
              <Box>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>{product.name}</Typography>
              </Box>
            </TableCell>
            <TableCell>
              <Chip
                label={product.sku}
                size="small"
                variant="outlined"
                sx={{ fontFamily: 'monospace', fontSize: '0.75rem', borderColor: '#e2e8f0' }}
              />
            </TableCell>
            <TableCell>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>{formatCurrency(product.price)}</Typography>
            </TableCell>
            <TableCell>
              <Typography variant="body2" sx={{ fontWeight: 700 }}>{product.quantity_in_stock}</Typography>
            </TableCell>
            <TableCell>{getStockBadge(product.quantity_in_stock)}</TableCell>
            <TableCell align="right">
              <Tooltip title="Edit">
                <IconButton size="small" onClick={() => handleOpenEdit(product)} sx={{ color: 'text.secondary' }}>
                  <EditIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title="Delete">
                <IconButton
                  size="small"
                  onClick={() => { setProductToDelete(product); setDeleteDialogOpen(true); }}
                  sx={{ color: 'text.secondary', '&:hover': { color: 'error.main' } }}
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </TableCell>
          </TableRow>
        )}
      />
      {renderModals()}
    </Box>
  );
}
