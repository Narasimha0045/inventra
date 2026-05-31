import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

// Response interceptor to extract data
apiClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const message =
      error.response?.data?.message ||
      error.message ||
      'An unexpected error occurred';
    return Promise.reject(new Error(message));
  }
);

// ─── Product APIs ──────────────────────────────────────────────────────────

export const productApi = {
  getAll: (search = '') =>
    apiClient.get(`/products${search ? `?search=${encodeURIComponent(search)}` : ''}`),
  getById: (id) => apiClient.get(`/products/${id}`),
  create: (data) => apiClient.post('/products', data),
  update: (id, data) => apiClient.put(`/products/${id}`, data),
  delete: (id) => apiClient.delete(`/products/${id}`),
};

// ─── Customer APIs ─────────────────────────────────────────────────────────

export const customerApi = {
  getAll: (search = '') =>
    apiClient.get(`/customers${search ? `?search=${encodeURIComponent(search)}` : ''}`),
  getById: (id) => apiClient.get(`/customers/${id}`),
  create: (data) => apiClient.post('/customers', data),
  delete: (id) => apiClient.delete(`/customers/${id}`),
};

// ─── Order APIs ────────────────────────────────────────────────────────────

export const orderApi = {
  getAll: () => apiClient.get('/orders'),
  getById: (id) => apiClient.get(`/orders/${id}`),
  create: (data) => apiClient.post('/orders', data),
  delete: (id) => apiClient.delete(`/orders/${id}`),
};

// ─── Dashboard API ─────────────────────────────────────────────────────────

export const dashboardApi = {
  getSummary: () => apiClient.get('/dashboard/summary'),
};

export default apiClient;
