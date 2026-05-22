import api from './client';

// ─── Transactions ────────────────────────────────────────────────────────────
export const getTransactions = (params = {}) =>
  api.get('/transactions', { params }).then((r) => r.data);

export const createTransaction = (data) =>
  api.post('/transactions', data).then((r) => r.data);

export const updateTransaction = (id, data) =>
  api.put(`/transactions/${id}`, data).then((r) => r.data);

export const deleteTransaction = (id) =>
  api.delete(`/transactions/${id}`).then((r) => r.data);

// ─── Categories ──────────────────────────────────────────────────────────────
export const getCategories = (params = {}) =>
  api.get('/categories', { params }).then((r) => r.data);

export const createCategory = (data) =>
  api.post('/categories', data).then((r) => r.data);

// ─── Budgets ─────────────────────────────────────────────────────────────────
export const getBudgets = (params) =>
  api.get('/budgets', { params }).then((r) => r.data);

export const createBudget = (data) =>
  api.post('/budgets', data).then((r) => r.data);
