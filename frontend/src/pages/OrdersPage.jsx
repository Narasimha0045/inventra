import React, { useEffect, useState } from 'react';
import {
  Box, TableCell, TableRow, IconButton, Tooltip, Typography, Avatar,
  Chip, Dialog, DialogTitle, DialogContent, DialogActions, Button,
  TextField, Autocomplete, Grid, Card, CardContent, Divider,
  alpha, useMediaQuery, useTheme, Paper,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/DeleteRounded';
import VisibilityIcon from '@mui/icons-material/VisibilityRounded';
import AddIcon from '@mui/icons-material/AddRounded';
import RemoveIcon from '@mui/icons-material/RemoveRounded';
import ReceiptIcon from '@mui/icons-material/ReceiptLongRounded';
import CloseIcon from '@mui/icons-material/Close';
import { useSnackbar } from 'notistack';
import { useAppContext } from '../context/AppContext';
import PageHeader from '../components/PageHeader';
import DataTable from '../components/DataTable';
import ConfirmDialog from '../components/ConfirmDialog';

function formatCurrency(val) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(val || 0);
}

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('en-IN', {
    month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

const columns = [
  { field: 'id', headerName: 'Order' },
  { field: 'customer', headerName: 'Customer' },
  { field: 'items', headerName: 'Items', width: 100 },
  { field: 'total', headerName: 'Total', width: 130 },
  { field: 'date', headerName: 'Date', width: 180 },
  { field: 'actions', headerName: '', width: 100 },
];

export default function OrdersPage() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { enqueueSnackbar } = useSnackbar();
  const {
    orders, products, customers, loading,
    fetchOrders, fetchProducts, fetchCustomers,
    createOrder, deleteOrder,
  } = useAppContext();

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [orderToDelete, setOrderToDelete] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Order creation state
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [orderItems, setOrderItems] = useState([]);

  useEffect(() => {
    fetchOrders();
    fetchProducts();
    fetchCustomers();
  }, [fetchOrders, fetchProducts, fetchCustomers]);

  const handleOpenCreate = () => {
    setSelectedCustomer(null);
    setOrderItems([]);
    setCreateModalOpen(true);
  };

  const handleAddItem = (product) => {
    if (!product) return;
    const exists = orderItems.find((i) => i.product_id === product.id);
    if (exists) {
      enqueueSnackbar('Product already added. Adjust quantity instead.', { variant: 'info' });
      return;
    }
    setOrderItems([
      ...orderItems,
      {
        product_id: product.id,
        product_name: product.name,
        product_sku: product.sku,
        unit_price: product.price,
        max_qty: product.quantity_in_stock,
        quantity: 1,
      },
    ]);
  };

  const handleQtyChange = (index, delta) => {
    const updated = [...orderItems];
    const newQty = updated[index].quantity + delta;
    if (newQty < 1) return;
    if (newQty > updated[index].max_qty) {
      enqueueSnackbar(`Only ${updated[index].max_qty} available in stock`, { variant: 'warning' });
      return;
    }
    updated[index].quantity = newQty;
    setOrderItems(updated);
  };

  const handleRemoveItem = (index) => {
    setOrderItems(orderItems.filter((_, i) => i !== index));
  };

  const orderTotal = orderItems.reduce((sum, i) => sum + i.unit_price * i.quantity, 0);

  const handleSubmitOrder = async () => {
    if (!selectedCustomer) {
      enqueueSnackbar('Please select a customer', { variant: 'warning' });
      return;
    }
    if (orderItems.length === 0) {
      enqueueSnackbar('Please add at least one product', { variant: 'warning' });
      return;
    }
    setSubmitting(true);
    try {
      await createOrder({
        customer_id: selectedCustomer.id,
        items: orderItems.map((i) => ({ product_id: i.product_id, quantity: i.quantity })),
      });
      enqueueSnackbar('Order created successfully', { variant: 'success' });
      setCreateModalOpen(false);
    } catch (err) {
      enqueueSnackbar(err.message, { variant: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    try {
      await deleteOrder(orderToDelete.id);
      enqueueSnackbar('Order deleted successfully', { variant: 'success' });
    } catch (err) {
      enqueueSnackbar(err.message, { variant: 'error' });
    }
    setDeleteDialogOpen(false);
    setOrderToDelete(null);
  };

  const handleViewOrder = (order) => {
    setSelectedOrder(order);
    setDetailModalOpen(true);
  };

  // ─── Create Order Modal ──────────────────────────────────────────────
  const createOrderModal = (
    <Dialog
      open={createModalOpen}
      onClose={() => setCreateModalOpen(false)}
      maxWidth="md"
      fullWidth
      PaperProps={{ sx: { borderRadius: 4 } }}
    >
      <DialogTitle sx={{ fontWeight: 700, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        Create New Order
        <IconButton onClick={() => setCreateModalOpen(false)} size="small">
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers sx={{ borderColor: '#f1f5f9', p: 3 }}>
        <Grid container spacing={3}>
          {/* Customer Selection */}
          <Grid item xs={12}>
            <Typography variant="overline" sx={{ color: 'text.secondary', fontSize: '0.7rem', mb: 1, display: 'block' }}>
              Customer
            </Typography>
            <Autocomplete
              id="order-customer-select"
              options={customers}
              getOptionLabel={(opt) => `${opt.full_name} (${opt.email})`}
              value={selectedCustomer}
              onChange={(_, val) => setSelectedCustomer(val)}
              renderInput={(params) => (
                <TextField {...params} placeholder="Search and select a customer..." size="small" />
              )}
              renderOption={(props, option) => {
                const { key, ...rest } = props;
                return (
                  <li key={key} {...rest}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <Avatar sx={{ width: 30, height: 30, fontSize: '0.75rem', bgcolor: alpha('#6366f1', 0.1), color: '#6366f1', fontWeight: 700 }}>
                        {option.full_name.charAt(0)}
                      </Avatar>
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>{option.full_name}</Typography>
                        <Typography variant="caption" color="text.secondary">{option.email}</Typography>
                      </Box>
                    </Box>
                  </li>
                );
              }}
            />
          </Grid>

          {/* Product Selection */}
          <Grid item xs={12}>
            <Typography variant="overline" sx={{ color: 'text.secondary', fontSize: '0.7rem', mb: 1, display: 'block' }}>
              Add Products
            </Typography>
            <Autocomplete
              id="order-product-select"
              options={products.filter((p) => p.quantity_in_stock > 0)}
              getOptionLabel={(opt) => `${opt.name} (${opt.sku}) — ${formatCurrency(opt.price)}`}
              onChange={(_, val) => { handleAddItem(val); }}
              value={null}
              renderInput={(params) => (
                <TextField {...params} placeholder="Search for products to add..." size="small" />
              )}
              renderOption={(props, option) => {
                const { key, ...rest } = props;
                return (
                  <li key={key} {...rest}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>{option.name}</Typography>
                        <Typography variant="caption" color="text.secondary">{option.sku} · {option.quantity_in_stock} in stock</Typography>
                      </Box>
                      <Typography variant="body2" sx={{ fontWeight: 700, color: 'primary.main' }}>
                        {formatCurrency(option.price)}
                      </Typography>
                    </Box>
                  </li>
                );
              }}
            />
          </Grid>

          {/* Order Items */}
          {orderItems.length > 0 && (
            <Grid item xs={12}>
              <Typography variant="overline" sx={{ color: 'text.secondary', fontSize: '0.7rem', mb: 1.5, display: 'block' }}>
                Order Items ({orderItems.length})
              </Typography>
              {orderItems.map((item, idx) => (
                <Paper
                  key={item.product_id}
                  variant="outlined"
                  sx={{
                    p: 2,
                    mb: 1.5,
                    borderRadius: 3,
                    borderColor: '#f1f5f9',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 2,
                    flexWrap: 'wrap',
                  }}
                >
                  <Box sx={{ flex: 1, minWidth: 150 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>{item.product_name}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {item.product_sku} · {formatCurrency(item.unit_price)} each
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <IconButton
                      size="small"
                      onClick={() => handleQtyChange(idx, -1)}
                      sx={{
                        width: 32, height: 32,
                        border: '1.5px solid #e2e8f0',
                        borderRadius: 2,
                      }}
                    >
                      <RemoveIcon sx={{ fontSize: 16 }} />
                    </IconButton>
                    <Typography sx={{ fontWeight: 700, minWidth: 24, textAlign: 'center' }}>
                      {item.quantity}
                    </Typography>
                    <IconButton
                      size="small"
                      onClick={() => handleQtyChange(idx, 1)}
                      sx={{
                        width: 32, height: 32,
                        border: '1.5px solid #e2e8f0',
                        borderRadius: 2,
                      }}
                    >
                      <AddIcon sx={{ fontSize: 16 }} />
                    </IconButton>
                  </Box>
                  <Typography variant="body2" sx={{ fontWeight: 700, minWidth: 80, textAlign: 'right' }}>
                    {formatCurrency(item.unit_price * item.quantity)}
                  </Typography>
                  <IconButton size="small" onClick={() => handleRemoveItem(idx)} sx={{ color: 'text.secondary' }}>
                    <CloseIcon sx={{ fontSize: 16 }} />
                  </IconButton>
                </Paper>
              ))}
              <Divider sx={{ my: 2 }} />
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 2 }}>
                <Typography variant="subtitle1" sx={{ color: 'text.secondary', fontWeight: 500 }}>
                  Total
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 800, color: 'primary.main' }}>
                  {formatCurrency(orderTotal)}
                </Typography>
              </Box>
            </Grid>
          )}
        </Grid>
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={() => setCreateModalOpen(false)} variant="outlined" color="inherit" sx={{ color: 'text.secondary' }}>
          Cancel
        </Button>
        <Button
          onClick={handleSubmitOrder}
          variant="contained"
          disabled={submitting || !selectedCustomer || orderItems.length === 0}
          sx={{
            px: 4,
            background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
            '&:hover': { background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)' },
          }}
        >
          {submitting ? 'Placing Order...' : 'Place Order'}
        </Button>
      </DialogActions>
    </Dialog>
  );

  // ─── Order Detail Modal (Invoice-style) ──────────────────────────────
  const orderDetailModal = (
    <Dialog
      open={detailModalOpen}
      onClose={() => setDetailModalOpen(false)}
      maxWidth="sm"
      fullWidth
      PaperProps={{ sx: { borderRadius: 4 } }}
    >
      {selectedOrder && (
        <>
          <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Box
                sx={{
                  width: 40, height: 40, borderRadius: 2.5,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: 'linear-gradient(135deg, #eff6ff, #dbeafe)',
                }}
              >
                <ReceiptIcon sx={{ color: '#3b82f6', fontSize: 22 }} />
              </Box>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>Order #{selectedOrder.id}</Typography>
                <Typography variant="caption" color="text.secondary">{formatDate(selectedOrder.created_at)}</Typography>
              </Box>
            </Box>
            <IconButton onClick={() => setDetailModalOpen(false)} size="small">
              <CloseIcon fontSize="small" />
            </IconButton>
          </DialogTitle>
          <DialogContent dividers sx={{ borderColor: '#f1f5f9', p: 3 }}>
            {/* Customer Info */}
            {selectedOrder.customer && (
              <Box sx={{ mb: 3, p: 2, borderRadius: 3, bgcolor: '#f8f9fb' }}>
                <Typography variant="overline" sx={{ color: 'text.secondary', fontSize: '0.65rem' }}>
                  Customer
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>{selectedOrder.customer.full_name}</Typography>
                <Typography variant="caption" color="text.secondary">{selectedOrder.customer.email}</Typography>
              </Box>
            )}

            {/* Items */}
            <Typography variant="overline" sx={{ color: 'text.secondary', fontSize: '0.65rem', mb: 1.5, display: 'block' }}>
              Items
            </Typography>
            {selectedOrder.items.map((item) => (
              <Box
                key={item.id}
                sx={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  py: 1.5, borderBottom: '1px solid #f1f5f9',
                }}
              >
                <Box>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {item.product?.name || `Product #${item.product_id}`}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {item.quantity} × {formatCurrency(item.unit_price)}
                  </Typography>
                </Box>
                <Typography variant="body2" sx={{ fontWeight: 700 }}>
                  {formatCurrency(item.subtotal)}
                </Typography>
              </Box>
            ))}

            <Divider sx={{ my: 2 }} />
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>Total</Typography>
              <Typography variant="h5" sx={{ fontWeight: 800, color: 'primary.main' }}>
                {formatCurrency(selectedOrder.total_amount)}
              </Typography>
            </Box>
          </DialogContent>
          <DialogActions sx={{ px: 3, py: 2 }}>
            <Button onClick={() => setDetailModalOpen(false)} variant="outlined" color="inherit">
              Close
            </Button>
          </DialogActions>
        </>
      )}
    </Dialog>
  );

  // ─── Mobile Card View ─────────────────────────────────────────────────
  if (isMobile) {
    return (
      <Box>
        <PageHeader title="Orders" subtitle="Track and manage customer orders" actionLabel="Create Order" onAction={handleOpenCreate} />
        <Grid container spacing={2}>
          {orders.map((o) => (
            <Grid item xs={12} key={o.id}>
              <Card>
                <CardContent sx={{ p: 2.5 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Box>
                      <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Order #{o.id}</Typography>
                      <Typography variant="caption" color="text.secondary">{formatDate(o.created_at)}</Typography>
                    </Box>
                    <Typography variant="h6" sx={{ fontWeight: 700, color: 'primary.main' }}>
                      {formatCurrency(o.total_amount)}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="body2" color="text.secondary">
                      {o.customer?.full_name || 'N/A'} · {o.items?.length || 0} items
                    </Typography>
                    <Box>
                      <IconButton size="small" onClick={() => handleViewOrder(o)}>
                        <VisibilityIcon fontSize="small" />
                      </IconButton>
                      <IconButton size="small" color="error" onClick={() => { setOrderToDelete(o); setDeleteDialogOpen(true); }}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
        {createOrderModal}
        {orderDetailModal}
        <ConfirmDialog
          open={deleteDialogOpen}
          onClose={() => setDeleteDialogOpen(false)}
          onConfirm={handleDelete}
          title="Delete Order"
          message={`Are you sure you want to delete Order #${orderToDelete?.id}?`}
        />
      </Box>
    );
  }

  return (
    <Box>
      <PageHeader title="Orders" subtitle="Track and manage customer orders" actionLabel="Create Order" onAction={handleOpenCreate} />
      <DataTable
        columns={columns}
        rows={orders}
        loading={loading.orders}
        emptyMessage="No orders yet"
        renderRow={(order) => (
          <TableRow key={order.id} hover>
            <TableCell>
              <Typography variant="body2" sx={{ fontWeight: 700 }}>#{order.id}</Typography>
            </TableCell>
            <TableCell>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Avatar
                  sx={{
                    width: 30, height: 30, fontSize: '0.7rem', fontWeight: 700,
                    bgcolor: alpha('#6366f1', 0.1), color: '#6366f1',
                  }}
                >
                  {order.customer?.full_name?.charAt(0) || '?'}
                </Avatar>
                <Box>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>{order.customer?.full_name || 'N/A'}</Typography>
                  <Typography variant="caption" color="text.secondary">{order.customer?.email}</Typography>
                </Box>
              </Box>
            </TableCell>
            <TableCell>
              <Chip
                label={`${order.items?.length || 0} items`}
                size="small"
                sx={{ bgcolor: '#f1f5f9', fontWeight: 600 }}
              />
            </TableCell>
            <TableCell>
              <Typography variant="body2" sx={{ fontWeight: 700, color: 'primary.main' }}>
                {formatCurrency(order.total_amount)}
              </Typography>
            </TableCell>
            <TableCell>
              <Typography variant="body2" color="text.secondary">{formatDate(order.created_at)}</Typography>
            </TableCell>
            <TableCell align="right">
              <Tooltip title="View Details">
                <IconButton size="small" onClick={() => handleViewOrder(order)} sx={{ color: 'text.secondary' }}>
                  <VisibilityIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title="Delete">
                <IconButton
                  size="small"
                  onClick={() => { setOrderToDelete(order); setDeleteDialogOpen(true); }}
                  sx={{ color: 'text.secondary', '&:hover': { color: 'error.main' } }}
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </TableCell>
          </TableRow>
        )}
      />
      {createOrderModal}
      {orderDetailModal}
      <ConfirmDialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleDelete}
        title="Delete Order"
        message={`Are you sure you want to delete Order #${orderToDelete?.id}?`}
      />
    </Box>
  );
}
