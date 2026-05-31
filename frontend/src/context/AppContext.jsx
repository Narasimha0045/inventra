import React, { createContext, useContext, useState, useCallback } from 'react';
import { productApi, customerApi, orderApi, dashboardApi } from '../api/client';

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState({});

  const setFieldLoading = (field, value) =>
    setLoading((prev) => ({ ...prev, [field]: value }));

  // ─── Products ─────────────────────────────────────────────────────
  const fetchProducts = useCallback(async (search = '') => {
    setFieldLoading('products', true);
    try {
      const res = await productApi.getAll(search);
      setProducts(res.data);
    } catch (err) {
      throw err;
    } finally {
      setFieldLoading('products', false);
    }
  }, []);

  const createProduct = useCallback(async (data) => {
    const res = await productApi.create(data);
    await fetchProducts();
    return res.data;
  }, [fetchProducts]);

  const updateProduct = useCallback(async (id, data) => {
    const res = await productApi.update(id, data);
    await fetchProducts();
    return res.data;
  }, [fetchProducts]);

  const deleteProduct = useCallback(async (id) => {
    await productApi.delete(id);
    await fetchProducts();
  }, [fetchProducts]);

  // ─── Customers ────────────────────────────────────────────────────
  const fetchCustomers = useCallback(async (search = '') => {
    setFieldLoading('customers', true);
    try {
      const res = await customerApi.getAll(search);
      setCustomers(res.data);
    } catch (err) {
      throw err;
    } finally {
      setFieldLoading('customers', false);
    }
  }, []);

  const createCustomer = useCallback(async (data) => {
    const res = await customerApi.create(data);
    await fetchCustomers();
    return res.data;
  }, [fetchCustomers]);

  const deleteCustomer = useCallback(async (id) => {
    await customerApi.delete(id);
    await fetchCustomers();
  }, [fetchCustomers]);

  // ─── Orders ───────────────────────────────────────────────────────
  const fetchOrders = useCallback(async () => {
    setFieldLoading('orders', true);
    try {
      const res = await orderApi.getAll();
      setOrders(res.data);
    } catch (err) {
      throw err;
    } finally {
      setFieldLoading('orders', false);
    }
  }, []);

  const createOrder = useCallback(async (data) => {
    const res = await orderApi.create(data);
    await fetchOrders();
    await fetchProducts();
    return res.data;
  }, [fetchOrders, fetchProducts]);

  const deleteOrder = useCallback(async (id) => {
    await orderApi.delete(id);
    await fetchOrders();
  }, [fetchOrders]);

  // ─── Dashboard ────────────────────────────────────────────────────
  const fetchDashboard = useCallback(async () => {
    setFieldLoading('dashboard', true);
    try {
      const res = await dashboardApi.getSummary();
      setDashboard(res.data);
    } catch (err) {
      throw err;
    } finally {
      setFieldLoading('dashboard', false);
    }
  }, []);

  const value = {
    products, customers, orders, dashboard, loading,
    fetchProducts, createProduct, updateProduct, deleteProduct,
    fetchCustomers, createCustomer, deleteCustomer,
    fetchOrders, createOrder, deleteOrder,
    fetchDashboard,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
}
