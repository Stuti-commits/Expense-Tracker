import React, { useState } from 'react';
import {
  PieChart, Pie, Cell, Tooltip,
  ResponsiveContainer, Sector,
} from 'recharts';

const formatINR = (value) =>
  value >= 100000
    ? `₹${(value / 100000).toFixed(1)}L`
    : `₹${(value / 1000).toFixed(1)}K`;

// Active sector expands on hover
const renderActiveShape = (props) => {
  const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill, payload, value } = props;
  return (
    <g>
      <text x={cx} y={cy - 10} textAnchor="middle" fill="#1a1a1a" fontSize={14} fontWeight={600}>
        {payload.name.length > 14 ? payload.name.slice(0, 13) + '…' : payload.name}
      </text>
      <text x={cx} y={cy + 14} textAnchor="middle" fill="#555" fontSize={13}>
        {formatINR(value)}
      </text>
      <Sector cx={cx} cy={cy} innerRadius={innerRadius} outerRadius={outerRadius + 8}
        startAngle={startAngle} endAngle={endAngle} fill={fill} />
    </g>
  );
};

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0];
  return (
    <div style={styles.tooltip}>
      <p style={{ fontWeight: 600, marginBottom: 4 }}>{d.name}</p>
      <p style={{ color: d.payload.color }}>{formatINR(d.value)}</p>
      <p style={{ color: '#888', fontSize: 12 }}>{d.payload.categoryType}</p>
    </div>
  );
};

const CategoryPieChart = ({ data, loading, error }) => {
  const [activeIndex, setActiveIndex] = useState(0);

  if (loading) return <div style={styles.placeholder}>Loading category split...</div>;
  if (error)   return <div style={styles.errorMsg}>{error}</div>;
  if (!data.length) return <div style={styles.placeholder}>No expense data for this month.</div>;

  return (
    <div style={styles.card}>
      <h3 style={styles.title}>Category Split</h3>
      <ResponsiveContainer width="100%" height={260}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={70}
            outerRadius={100}
            dataKey="value"
            activeIndex={activeIndex}
            activeShape={renderActiveShape}
            onMouseEnter={(_, index) => setActiveIndex(index)}
          >
            {data.map((entry, index) => (
              <Cell key={index} fill={entry.color || '#888'} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
        </PieChart>
      </ResponsiveContainer>

      {/* Legend */}
      <div style={styles.legend}>
        {data.slice(0, 8).map((entry, i) => (
          <div key={i} style={styles.legendItem}>
            <div style={{ ...styles.legendDot, background: entry.color }} />
            <span style={styles.legendLabel}>{entry.name}</span>
            <span style={styles.legendValue}>{formatINR(entry.value)}</span>
          </div>
        ))}
      </div>
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
  title: { margin: '0 0 8px', fontSize: 15, fontWeight: 600, color: '#1a1a1a' },
  placeholder: { padding: 40, textAlign: 'center', color: '#999' },
  errorMsg: { padding: 16, color: '#d32f2f', background: '#ffebee', borderRadius: 8 },
  tooltip: {
    background: '#fff',
    border: '1px solid #e0e0e0',
    borderRadius: 8,
    padding: '10px 14px',
    fontSize: 13,
  },
  legend: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
    marginTop: 8,
    maxHeight: 160,
    overflowY: 'auto',
  },
  legendItem: { display: 'flex', alignItems: 'center', gap: 8 },
  legendDot: { width: 10, height: 10, borderRadius: '50%', flexShrink: 0 },
  legendLabel: { fontSize: 12, color: '#444', flex: 1 },
  legendValue: { fontSize: 12, color: '#1a1a1a', fontWeight: 500 },
};

export default CategoryPieChart;
