import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import useDashboard from '../hooks/useDashboard';
import MonthlyTrendChart    from '../components/charts/MonthlyTrendChart';
import CategoryPieChart     from '../components/charts/CategoryPieChart';
import SpendSaveInvestChart from '../components/charts/SpendSaveInvestChart';
import BudgetAlerts         from '../components/charts/BudgetAlerts';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

const Dashboard = () => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const now = new Date();

  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year,  setYear]  = useState(now.getFullYear());

  const { monthlyTrend, categorySplit, spendSaveInvest, budgetStatus, refetch } =
    useDashboard({ month, year, trendMonths: 6 });

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <div style={s.page}>
      {/* ── Header ── */}
      <div style={s.header}>
        <div>
          <h1 style={s.h1}>Dashboard</h1>
          <p style={s.sub}>{currentUser?.email}</p>
        </div>
        <div style={s.controls}>
          <select value={month} onChange={e => setMonth(Number(e.target.value))} style={s.select}>
            {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
          </select>
          <select value={year} onChange={e => setYear(Number(e.target.value))} style={s.select}>
            {[now.getFullYear() - 1, now.getFullYear()].map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
          <button onClick={refetch} style={s.refreshBtn} title="Refresh">↻</button>
          <button onClick={handleLogout} style={s.logoutBtn}>Log out</button>
        </div>
      </div>

      {/* ── Charts grid ── */}
      <div style={s.grid}>
        {/* Row 1: full-width bar chart */}
        <div style={s.full}>
          <MonthlyTrendChart {...monthlyTrend} />
        </div>

        {/* Row 2: full-width stacked chart */}
        <div style={s.full}>
          <SpendSaveInvestChart {...spendSaveInvest} />
        </div>

        {/* Row 3: pie (left) + budget alerts (right) */}
        <div style={s.half}>
          <CategoryPieChart {...categorySplit} />
        </div>
        <div style={s.half}>
          <BudgetAlerts {...budgetStatus} />
        </div>
      </div>
    </div>
  );
};

const s = {
  page: { minHeight: '100vh', background: '#f7f8fa', padding: 24, boxSizing: 'border-box' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 12 },
  h1: { margin: 0, fontSize: 22, fontWeight: 700, color: '#1a1a1a' },
  sub: { margin: '4px 0 0', fontSize: 13, color: '#888' },
  controls: { display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' },
  select: { padding: '6px 10px', borderRadius: 6, border: '1px solid #ddd', fontSize: 13, background: '#fff', cursor: 'pointer' },
  refreshBtn: { padding: '6px 10px', borderRadius: 6, border: '1px solid #ddd', fontSize: 16, background: '#fff', cursor: 'pointer' },
  logoutBtn: { padding: '6px 14px', borderRadius: 6, border: '1px solid #ddd', fontSize: 13, background: '#f5f5f5', cursor: 'pointer', color: '#444' },
  grid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 },
  full: { gridColumn: '1 / -1' },
  half: { gridColumn: 'span 1', minWidth: 0 },
};

export default Dashboard;
