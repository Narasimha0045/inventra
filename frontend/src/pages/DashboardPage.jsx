import React, { useEffect } from 'react';
import {
  Grid, Box, Typography, Card, CardContent, Chip, Skeleton,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  alpha, Avatar,
} from '@mui/material';
import InventoryIcon from '@mui/icons-material/Inventory2Rounded';
import PeopleIcon from '@mui/icons-material/PeopleAltRounded';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCartRounded';
import AttachMoneyIcon from '@mui/icons-material/AttachMoneyRounded';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import { useAppContext } from '../context/AppContext';
import StatCard from '../components/StatCard';

function getStockBadge(qty) {
  if (qty === 0) return <Chip label="Out of Stock" size="small" sx={{ bgcolor: '#fef2f2', color: '#dc2626', fontWeight: 600 }} />;
  if (qty <= 5) return <Chip label="Low Stock" size="small" sx={{ bgcolor: '#fffbeb', color: '#d97706', fontWeight: 600 }} />;
  return <Chip label="In Stock" size="small" sx={{ bgcolor: '#f0fdf4', color: '#16a34a', fontWeight: 600 }} />;
}

function formatCurrency(val) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(val || 0);
}

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function DashboardPage() {
  const { dashboard, loading, fetchDashboard } = useAppContext();

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  if (loading.dashboard || !dashboard) {
    return (
      <Box>
        <Typography variant="h4" sx={{ fontWeight: 800, mb: 0.5 }}>Dashboard</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
          Overview of your inventory and orders
        </Typography>
        <Grid container spacing={3}>
          {[1, 2, 3, 4].map((i) => (
            <Grid item xs={12} sm={6} lg={3} key={i}>
              <Skeleton variant="rectangular" height={140} sx={{ borderRadius: 4 }} />
            </Grid>
          ))}
        </Grid>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" sx={{ fontWeight: 800, mb: 0.5 }}>Dashboard</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
        Overview of your inventory and orders
      </Typography>

      {/* KPI Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} lg={3}>
          <StatCard
            title="Total Products"
            value={dashboard.total_products}
            subtitle="Products in catalog"
            icon={InventoryIcon}
            color="#6366f1"
          />
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <StatCard
            title="Total Customers"
            value={dashboard.total_customers}
            subtitle="Registered customers"
            icon={PeopleIcon}
            color="#8b5cf6"
          />
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <StatCard
            title="Total Orders"
            value={dashboard.total_orders}
            subtitle="Orders placed"
            icon={ShoppingCartIcon}
            color="#06b6d4"
          />
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <StatCard
            title="Inventory Value"
            value={formatCurrency(dashboard.inventory_value)}
            subtitle="Total stock value"
            icon={AttachMoneyIcon}
            color="#10b981"
          />
        </Grid>
      </Grid>

      {/* Low Stock + Recent Orders */}
      <Grid container spacing={3}>
        {/* Low Stock Products */}
        <Grid item xs={12} lg={6}>
          <Card sx={{ height: '100%' }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
                <Box
                  sx={{
                    width: 36,
                    height: 36,
                    borderRadius: 2,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'linear-gradient(135deg, #fffbeb, #fef3c7)',
                  }}
                >
                  <WarningAmberIcon sx={{ color: '#d97706', fontSize: 20 }} />
                </Box>
                <Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700, color: 'text.primary', fontSize: '0.95rem' }}>
                    Low Stock Alert
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Products with ≤5 units remaining
                  </Typography>
                </Box>
              </Box>
              {dashboard.low_stock_products.length === 0 ? (
                <Box sx={{ py: 4, textAlign: 'center' }}>
                  <Typography variant="body2" color="text.secondary">
                    ✨ All products are well stocked
                  </Typography>
                </Box>
              ) : (
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Product</TableCell>
                        <TableCell align="right">Stock</TableCell>
                        <TableCell align="right">Status</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {dashboard.low_stock_products.map((p) => (
                        <TableRow key={p.id}>
                          <TableCell>
                            <Box>
                              <Typography variant="body2" sx={{ fontWeight: 600 }}>{p.name}</Typography>
                              <Typography variant="caption" color="text.secondary">{p.sku}</Typography>
                            </Box>
                          </TableCell>
                          <TableCell align="right">
                            <Typography variant="body2" sx={{ fontWeight: 700 }}>{p.quantity_in_stock}</Typography>
                          </TableCell>
                          <TableCell align="right">{getStockBadge(p.quantity_in_stock)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Recent Orders */}
        <Grid item xs={12} lg={6}>
          <Card sx={{ height: '100%' }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
                <Box
                  sx={{
                    width: 36,
                    height: 36,
                    borderRadius: 2,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'linear-gradient(135deg, #eff6ff, #dbeafe)',
                  }}
                >
                  <ShoppingCartIcon sx={{ color: '#3b82f6', fontSize: 20 }} />
                </Box>
                <Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700, color: 'text.primary', fontSize: '0.95rem' }}>
                    Recent Orders
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Latest 5 orders placed
                  </Typography>
                </Box>
              </Box>
              {dashboard.recent_orders.length === 0 ? (
                <Box sx={{ py: 4, textAlign: 'center' }}>
                  <Typography variant="body2" color="text.secondary">
                    No orders yet
                  </Typography>
                </Box>
              ) : (
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Order</TableCell>
                        <TableCell>Customer</TableCell>
                        <TableCell align="right">Amount</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {dashboard.recent_orders.map((o) => (
                        <TableRow key={o.id}>
                          <TableCell>
                            <Box>
                              <Typography variant="body2" sx={{ fontWeight: 600 }}>#{o.id}</Typography>
                              <Typography variant="caption" color="text.secondary">{formatDate(o.created_at)}</Typography>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Avatar
                                sx={{
                                  width: 28,
                                  height: 28,
                                  fontSize: '0.7rem',
                                  fontWeight: 700,
                                  bgcolor: alpha('#6366f1', 0.1),
                                  color: '#6366f1',
                                }}
                              >
                                {o.customer?.full_name?.charAt(0) || '?'}
                              </Avatar>
                              <Typography variant="body2">{o.customer?.full_name || 'N/A'}</Typography>
                            </Box>
                          </TableCell>
                          <TableCell align="right">
                            <Typography variant="body2" sx={{ fontWeight: 700 }}>
                              {formatCurrency(o.total_amount)}
                            </Typography>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Recently Added Products */}
        <Grid item xs={12}>
          <Card>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
                <Box
                  sx={{
                    width: 36,
                    height: 36,
                    borderRadius: 2,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'linear-gradient(135deg, #f0fdf4, #dcfce7)',
                  }}
                >
                  <InventoryIcon sx={{ color: '#16a34a', fontSize: 20 }} />
                </Box>
                <Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700, color: 'text.primary', fontSize: '0.95rem' }}>
                    Recently Added Products
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Latest products in your catalog
                  </Typography>
                </Box>
              </Box>
              {dashboard.recent_products.length === 0 ? (
                <Box sx={{ py: 4, textAlign: 'center' }}>
                  <Typography variant="body2" color="text.secondary">
                    No products added yet
                  </Typography>
                </Box>
              ) : (
                <Grid container spacing={2}>
                  {dashboard.recent_products.map((p) => (
                    <Grid item xs={12} sm={6} md={4} lg={2.4} key={p.id}>
                      <Box
                        sx={{
                          p: 2,
                          borderRadius: 3,
                          border: '1px solid #f1f5f9',
                          transition: 'all 0.2s ease',
                          '&:hover': {
                            borderColor: '#e2e8f0',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                          },
                        }}
                      >
                        <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>{p.name}</Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                          {p.sku}
                        </Typography>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Typography variant="body2" sx={{ fontWeight: 700, color: 'primary.main' }}>
                            {formatCurrency(p.price)}
                          </Typography>
                          {getStockBadge(p.quantity_in_stock)}
                        </Box>
                      </Box>
                    </Grid>
                  ))}
                </Grid>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
