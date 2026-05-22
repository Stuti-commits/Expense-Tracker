import React from 'react';

const fmt = (amount) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount);

const fmtDate = (date) =>
  new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

const TransactionList = ({ transactions, onEdit, onDelete, loading }) => {
  if (loading) return <p className="state-msg">Loading transactions...</p>;
  if (!transactions.length) return <p className="state-msg">No transactions yet. Add your first one above.</p>;

  return (
    <div className="transaction-list">
      {transactions.map((t) => (
        <div key={t._id} className={`transaction-item type-${t.type}`}>
          <div className="t-icon">{t.categoryId?.icon || '📦'}</div>

          <div className="t-main">
            <span className="t-name">{t.categoryId?.name || 'Uncategorized'}</span>
            {t.description && <span className="t-desc">{t.description}</span>}
            <span className="t-meta">
              {fmtDate(t.date)} · {t.paymentMode}
              {t.tags?.length > 0 && ` · ${t.tags.join(', ')}`}
            </span>
          </div>

          <div className="t-right">
            <span className={`t-amount ${t.type}`}>
              {t.type === 'income' ? '+' : '-'}{fmt(t.amount)}
            </span>
            <div className="t-actions">
              <button onClick={() => onEdit(t)} className="btn-icon" title="Edit">✏️</button>
              <button onClick={() => onDelete(t._id)} className="btn-icon" title="Delete">🗑️</button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default TransactionList;
