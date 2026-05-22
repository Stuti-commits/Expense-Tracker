import React from 'react';

const formatINR = (v) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(v);

const STATUS = {
  ok:      { bar: '#639922', bg: '#f4fae8', text: '#2d6a00', label: 'On track'    },
  warning: { bar: '#e0a800', bg: '#fffbea', text: '#8a6200', label: 'Approaching' },
  over:    { bar: '#d32f2f', bg: '#ffebee', text: '#d32f2f', label: 'Over budget' },
};

const AlertRow = ({ alert }) => {
  const cfg = STATUS[alert.status] || STATUS.ok;
  return (
    <div style={{ ...styles.row, background: cfg.bg }}>
      <div style={styles.rowTop}>
        <span style={styles.rowLabel}>
          {alert.icon} {alert.label}
        </span>
        <span style={{ ...styles.badge, color: cfg.text }}>{cfg.label}</span>
      </div>

      <div style={styles.track}>
        <div style={{ ...styles.fill, width: `${Math.min(alert.pct, 100)}%`, background: cfg.bar }} />
      </div>

      <div style={styles.rowBottom}>
        <span style={styles.spent}>{formatINR(alert.spent)} spent</span>
        <span style={styles.limit}>of {formatINR(alert.limit)} ({alert.pct}%)</span>
      </div>

      {alert.status === 'over' && (
        <p style={styles.overshoot}>⚠ Over by {formatINR(alert.overshoot)}</p>
      )}
    </div>
  );
};

const BudgetAlerts = ({ data, loading, error }) => {
  if (loading) return <div style={styles.placeholder}>Loading budget...</div>;
  if (error)   return <div style={styles.err}>{error}</div>;

  if (!data?.hasBudget) {
    return (
      <div style={styles.card}>
        <h3 style={styles.title}>Budget Status</h3>
        <p style={{ color: '#999', fontSize: 14 }}>No budget set for this month.</p>
      </div>
    );
  }

  const overCount = data.alerts.filter(a => a.status === 'over').length;

  return (
    <div style={styles.card}>
      <h3 style={styles.title}>Budget Status</h3>

      {overCount > 0 && (
        <div style={styles.banner}>
          🔴 {overCount} {overCount === 1 ? 'category has' : 'categories have'} exceeded budget
        </div>
      )}

      <div style={styles.list}>
        {data.alerts.map(a => <AlertRow key={a.categoryId} alert={a} />)}
      </div>
    </div>
  );
};

const styles = {
  card: { background: '#fff', borderRadius: 12, padding: '20px 16px', boxShadow: '0 1px 8px rgba(0,0,0,0.07)' },
  title: { margin: '0 0 12px', fontSize: 15, fontWeight: 600, color: '#1a1a1a' },
  banner: { background: '#ffebee', color: '#c62828', borderRadius: 8, padding: '8px 12px', fontSize: 13, marginBottom: 12 },
  list: { display: 'flex', flexDirection: 'column', gap: 10 },
  row: { borderRadius: 8, padding: '12px 14px' },
  rowTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  rowLabel: { fontWeight: 600, fontSize: 13, color: '#1a1a1a' },
  badge: { fontSize: 11, fontWeight: 600 },
  track: { height: 8, background: 'rgba(0,0,0,0.08)', borderRadius: 4, overflow: 'hidden', marginBottom: 6 },
  fill: { height: '100%', borderRadius: 4, transition: 'width 0.4s ease' },
  rowBottom: { display: 'flex', justifyContent: 'space-between' },
  spent: { fontSize: 12, fontWeight: 600, color: '#1a1a1a' },
  limit: { fontSize: 12, color: '#888' },
  overshoot: { margin: '6px 0 0', fontSize: 12, color: '#d32f2f', fontWeight: 500 },
  placeholder: { padding: 40, textAlign: 'center', color: '#999' },
  err: { padding: 16, color: '#d32f2f', background: '#ffebee', borderRadius: 8 },
};

export default BudgetAlerts;
