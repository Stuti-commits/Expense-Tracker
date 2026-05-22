import { useState, useEffect, useCallback } from 'react';
import {
  getTransactions,
  createTransaction,
  updateTransaction,
  deleteTransaction,
} from '../api/expenses';

export const useTransactions = (filters = {}) => {
  const [transactions, setTransactions] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getTransactions(filters);
      setTransactions(data.transactions);
      setPagination(data.pagination);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [JSON.stringify(filters)]); // eslint-disable-line

  useEffect(() => { fetch(); }, [fetch]);

  const add = async (formData) => {
    const data = await createTransaction(formData);
    setTransactions((prev) => [data.transaction, ...prev]);
    return data.transaction;
  };

  const edit = async (id, formData) => {
    const data = await updateTransaction(id, formData);
    setTransactions((prev) =>
      prev.map((t) => (t._id === id ? data.transaction : t))
    );
    return data.transaction;
  };

  const remove = async (id) => {
    await deleteTransaction(id);
    setTransactions((prev) => prev.filter((t) => t._id !== id));
  };

  return { transactions, pagination, loading, error, add, edit, remove, refetch: fetch };
};
