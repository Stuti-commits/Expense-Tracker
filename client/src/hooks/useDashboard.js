import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const API = process.env.REACT_APP_API_URL;

const useDashboard = ({ month, year, trendMonths = 6 }) => {
  const { getToken } = useAuth();

  const [monthlyTrend,    setMonthlyTrend]    = useState({ data: [], loading: true, error: null });
  const [categorySplit,   setCategorySplit]   = useState({ data: [], loading: true, error: null });
  const [spendSaveInvest, setSpendSaveInvest] = useState({ data: [], loading: true, error: null });
  const [budgetStatus,    setBudgetStatus]    = useState({ data: null, loading: true, error: null });

  const fetchAll = useCallback(async () => {
    let headers;
    try {
      const token = await getToken();
      headers = { Authorization: `Bearer ${token}` };
    } catch {
      return;
    }

    // Fire all 4 in parallel — failures are isolated per chart
    const [trendRes, splitRes, flowRes, budgetRes] = await Promise.allSettled([
      axios.get(`${API}/dashboard/monthly-trend?year=${year}`, { headers }),
      axios.get(`${API}/dashboard/category-split?month=${month}&year=${year}`, { headers }),
      axios.get(`${API}/dashboard/spend-save-invest?months=${trendMonths}`, { headers }),
      axios.get(`${API}/dashboard/budget-status?month=${month}&year=${year}`, { headers }),
    ]);

    setMonthlyTrend({
      data:    trendRes.status  === 'fulfilled' ? trendRes.value.data.data   : [],
      loading: false,
      error:   trendRes.status  === 'rejected'  ? 'Failed to load trend'     : null,
    });
    setCategorySplit({
      data:    splitRes.status  === 'fulfilled' ? splitRes.value.data.data   : [],
      loading: false,
      error:   splitRes.status  === 'rejected'  ? 'Failed to load categories': null,
    });
    setSpendSaveInvest({
      data:    flowRes.status   === 'fulfilled' ? flowRes.value.data.data    : [],
      loading: false,
      error:   flowRes.status   === 'rejected'  ? 'Failed to load flow data' : null,
    });
    setBudgetStatus({
      data:    budgetRes.status === 'fulfilled' ? budgetRes.value.data       : null,
      loading: false,
      error:   budgetRes.status === 'rejected'  ? 'Failed to load budgets'   : null,
    });
  }, [month, year, trendMonths, getToken]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  return { monthlyTrend, categorySplit, spendSaveInvest, budgetStatus, refetch: fetchAll };
};

export default useDashboard;
