import React, { useState } from 'react';
import { useTransactions } from '../hooks/useTransactions';
import ExpenseForm from '../components/ExpenseForm';
import TransactionList from '../components/TransactionList';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const now = new Date();

const Expenses = () => {
  const { logout, currentUser } = useAuth();
  const navigate = useNavigate();

  // Filters for the current month by default
  const [filters, setFilters] = useState({
    month: now.getMonth() + 1,
    year: now.getFullYear(),
  });

  const { transactions, loading, error, add, edit, remove } = useTransactions(filters);

  const [showForm, setShowForm] = useState(false);
  const [editTarget, setEditTarget] = useState(null); // transaction being edited
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const handleAdd = async (data) => {
    setSubmitting(true);
    setFormError('');
    try {
      await add(data);
      setShowForm(false);
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = async (data) => {
    setSubmitting(true);
    setFormError('');
    try {
      await edit(editTarget._id, data);
      setEditTarget(null);
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this transaction?')) return;
    try {
      await remove(id);
    } catch (err) {
      alert(err.message);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

  const totalExpenses = transactions
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalIncome = transactions
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const fmt = (n) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(n);

  return (
    <div className="expenses-page">
      {/* Header */}
      <header className="app-header">
        <div>
          <h1>💸 Expenses</h1>
          <span className="user-email">{currentUser?.email}</span>
        </div>
        <button onClick={handleLogout} className="btn-secondary">Log out</button>
      </header>

      {/* Month picker */}
      <div className="month-bar">
        {MONTHS.map((m, i) => (
          <button
            key={m}
            className={`month-btn ${filters.month === i + 1 ? 'active' : ''}`}
            onClick={() => setFilters((f) => ({ ...f, month: i + 1 }))}
          >
            {m}
          </button>
        ))}
        <select
          value={filters.year}
          onChange={(e) => setFilters((f) => ({ ...f, year: Number(e.target.value) }))}
          className="year-select"
        >
          {[2023, 2024, 2025, 2026].map((y) => <option key={y}>{y}</option>)}
        </select>
      </div>

      {/* Summary cards */}
      <div className="summary-cards">
        <div className="card expense-card">
          <span className="card-label">Spent</span>
          <span className="card-amount">{fmt(totalExpenses)}</span>
        </div>
        <div className="card income-card">
          <span className="card-label">Earned</span>
          <span className="card-amount">{fmt(totalIncome)}</span>
        </div>
        <div className="card net-card">
          <span className="card-label">Net</span>
          <span className={`card-amount ${totalIncome - totalExpenses >= 0 ? 'positive' : 'negative'}`}>
            {fmt(totalIncome - totalExpenses)}
          </span>
        </div>
      </div>

      {/* Add button */}
      {!showForm && !editTarget && (
        <button className="btn-add" onClick={() => setShowForm(true)}>
          + Add Transaction
        </button>
      )}

      {/* Add form */}
      {showForm && (
        <div className="form-container">
          <ExpenseForm
            onSubmit={handleAdd}
            onCancel={() => setShowForm(false)}
            loading={submitting}
          />
          {formError && <p className="form-error">{formError}</p>}
        </div>
      )}

      {/* Edit form */}
      {editTarget && (
        <div className="form-container">
          <ExpenseForm
            initial={editTarget}
            onSubmit={handleEdit}
            onCancel={() => setEditTarget(null)}
            loading={submitting}
          />
          {formError && <p className="form-error">{formError}</p>}
        </div>
      )}

      {/* Error state */}
      {error && <p className="state-msg error">{error}</p>}

      {/* Transaction list */}
      <TransactionList
        transactions={transactions}
        loading={loading}
        onEdit={(t) => { setEditTarget(t); setShowForm(false); }}
        onDelete={handleDelete}
      />
    </div>
  );
};

export default Expenses;
