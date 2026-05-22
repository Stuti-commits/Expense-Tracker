import React from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
} from 'recharts';

const formatINR = (v) =>
  v >= 100000 ? `₹${(v/100000).toFixed(1)}L` : `₹${(v/1000).toFixed(0)}K`;

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={styles.tooltip}>
      <p style={styles.ttTitle}>{label}</p>
      {payload.map(e => (
        <p key={e.name} style={{ color: e.color, margin: '2px 0', fontSize: 12 }}>
          {e.name}: {formatINR(e.value)}
        </p>
      ))}
    </div>
  );
};

const SpendSaveInvestChart = ({ data, loading, error }) => {
  if (loading) return <div style={styles.placeholder}>Loading...</div>;
  if (error)   return <div style={styles.err}>{error}</div>;

  return (
    <div style={styles.card}>
      <h3 style={styles.title}>Income · Spend · Savings</h3>
      <p style={styles.sub}>Savings = income minus expenses per month</p>
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="label" tick={{ fontSize: 11 }} />
          <YAxis tickFormatter={formatINR} tick={{ fontSize: 11 }} width={60} />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          <Bar dataKey="income"  name="Income"  fill="#0C447C" radius={[3,3,0,0]} />
          <Bar dataKey="expense" name="Expense" fill="#D85A30" radius={[3,3,0,0]} />
          <Bar dataKey="savings" name="Savings" fill="#639922" radius={[3,3,0,0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

const styles = {
  card: { background: '#fff', borderRadius: 12, padding: '20px 16px', boxShadow: '0 1px 8px rgba(0,0,0,0.07)' },
  title: { margin: '0 0 4px', fontSize: 15, fontWeight: 600, color: '#1a1a1a' },
  sub: { margin: '0 0 16px', fontSize: 12, color: '#888' },
  placeholder: { padding: 40, textAlign: 'center', color: '#999' },
  err: { padding: 16, color: '#d32f2f', background: '#ffebee', borderRadius: 8 },
  tooltip: { background: '#fff', border: '1px solid #e0e0e0', borderRadius: 8, padding: '10px 14px', fontSize: 13 },
  ttTitle: { margin: '0 0 6px', fontWeight: 600, color: '#333' },
};

export default SpendSaveInvestChart;
