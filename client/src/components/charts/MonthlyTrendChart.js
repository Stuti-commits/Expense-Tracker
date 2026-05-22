import React from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
} from 'recharts';

const MONTH_LABELS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

const formatINR = (value) =>
  value >= 100000
    ? `₹${(value / 100000).toFixed(1)}L`
    : value >= 1000
    ? `₹${(value / 1000).toFixed(0)}K`
    : `₹${value}`;

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={styles.tooltip}>
      <p style={styles.tooltipTitle}>{MONTH_LABELS[label - 1]}</p>
      {payload.map((entry) => (
        <p key={entry.name} style={{ color: entry.color, margin: '2px 0' }}>
          {entry.name.charAt(0).toUpperCase() + entry.name.slice(1)}: {formatINR(entry.value)}
        </p>
      ))}
    </div>
  );
};

const MonthlyTrendChart = ({ data, loading, error }) => {
  if (loading) return <div style={styles.placeholder}>Loading monthly trend...</div>;
  if (error)   return <div style={styles.errorMsg}>{error}</div>;

  const chartData = data.map(d => ({ ...d, monthLabel: MONTH_LABELS[d.month - 1] }));

  return (
    <div style={styles.card}>
      <h3 style={styles.title}>Monthly Trend</h3>
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={chartData} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="monthLabel" tick={{ fontSize: 12 }} />
          <YAxis tickFormatter={formatINR} tick={{ fontSize: 11 }} width={60} />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          <Bar dataKey="income"     name="Income"     fill="#0C447C" radius={[3,3,0,0]} />
          <Bar dataKey="expense"    name="Expense"    fill="#D85A30" radius={[3,3,0,0]} />
          <Bar dataKey="investment" name="Investment" fill="#639922" radius={[3,3,0,0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

const styles = {
  card: {
    background: '#fff',
    borderRadius: 12,
    padding: '20px 16px',
    boxShadow: '0 1px 8px rgba(0,0,0,0.07)',
  },
  title: { margin: '0 0 16px', fontSize: 15, fontWeight: 600, color: '#1a1a1a' },
  placeholder: { padding: 40, textAlign: 'center', color: '#999' },
  errorMsg: { padding: 16, color: '#d32f2f', background: '#ffebee', borderRadius: 8 },
  tooltip: {
    background: '#fff',
    border: '1px solid #e0e0e0',
    borderRadius: 8,
    padding: '10px 14px',
    fontSize: 13,
  },
  tooltipTitle: { margin: '0 0 6px', fontWeight: 600, color: '#333' },
};

export default MonthlyTrendChart;
