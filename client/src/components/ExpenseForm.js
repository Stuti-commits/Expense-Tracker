import React, { useState, useEffect } from 'react';
import { getCategories } from '../api/expenses';

const PAYMENT_MODES = ['upi', 'cash', 'card', 'netbanking', 'other'];
const TYPES = ['expense', 'income', 'transfer'];

const defaultForm = {
  amount: '',
  type: 'expense',
  categoryId: '',
  date: new Date().toISOString().slice(0, 10), // YYYY-MM-DD for input[type=date]
  description: '',
  paymentMode: 'upi',
  tags: '',
};

/**
 * Props:
 *   initial   — transaction object for edit mode (optional)
 *   onSubmit  — called with form data (add or edit)
 *   onCancel  — called when form is dismissed
 *   loading   — disables submit while API call is in flight
 */
const ExpenseForm = ({ initial, onSubmit, onCancel, loading }) => {
  const [form, setForm] = useState(defaultForm);
  const [categories, setCategories] = useState([]);
  const [catLoading, setCatLoading] = useState(true);
  const [error, setError] = useState('');

  // Populate categories on mount
  useEffect(() => {
    getCategories()
      .then((d) => setCategories(d.categories))
      .catch((err) => setError(err.message))
      .finally(() => setCatLoading(false));
  }, []);

  // Populate form fields when editing an existing transaction
  useEffect(() => {
    if (initial) {
      setForm({
        amount: initial.amount,
        type: initial.type,
        categoryId: initial.categoryId?._id || initial.categoryId || '',
        date: new Date(initial.date).toISOString().slice(0, 10),
        description: initial.description || '',
        paymentMode: initial.paymentMode || 'upi',
        tags: (initial.tags || []).join(', '),
      });
    }
  }, [initial]);

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!form.amount || Number(form.amount) <= 0) {
      return setError('Amount must be greater than 0');
    }
    if (!form.categoryId) return setError('Please select a category');

    const payload = {
      ...form,
      amount: Number(form.amount),
      tags: form.tags ? form.tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
    };

    try {
      await onSubmit(payload);
      if (!initial) setForm(defaultForm); // Reset only on add, not edit
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="expense-form">
      <h2>{initial ? 'Edit Transaction' : 'Add Transaction'}</h2>

      {error && <p className="form-error">{error}</p>}

      {/* Type toggle */}
      <div className="type-toggle">
        {TYPES.map((t) => (
          <button
            key={t}
            type="button"
            className={`type-btn ${form.type === t ? 'active' : ''} type-${t}`}
            onClick={() => setForm((f) => ({ ...f, type: t }))}
          >
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      <div className="form-row">
        <label>Amount (₹)</label>
        <input
          type="number"
          placeholder="0.00"
          value={form.amount}
          onChange={set('amount')}
          min="0.01"
          step="0.01"
          required
        />
      </div>

      <div className="form-row">
        <label>Category</label>
        <select value={form.categoryId} onChange={set('categoryId')} required>
          <option value="">— Select category —</option>
          {catLoading ? (
            <option disabled>Loading...</option>
          ) : (
            categories.map((c) => (
              <option key={c._id} value={c._id}>
                {c.icon} {c.name}
              </option>
            ))
          )}
        </select>
      </div>

      <div className="form-row">
        <label>Date</label>
        <input type="date" value={form.date} onChange={set('date')} required />
      </div>

      <div className="form-row">
        <label>Payment mode</label>
        <select value={form.paymentMode} onChange={set('paymentMode')}>
          {PAYMENT_MODES.map((m) => (
            <option key={m} value={m}>{m.charAt(0).toUpperCase() + m.slice(1)}</option>
          ))}
        </select>
      </div>

      <div className="form-row">
        <label>Description</label>
        <input
          type="text"
          placeholder="What was this for?"
          value={form.description}
          onChange={set('description')}
          maxLength={500}
        />
      </div>

      <div className="form-row">
        <label>Tags</label>
        <input
          type="text"
          placeholder="e.g. work, personal, travel (comma separated)"
          value={form.tags}
          onChange={set('tags')}
        />
      </div>

      <div className="form-actions">
        <button type="button" onClick={onCancel} className="btn-secondary">
          Cancel
        </button>
        <button type="submit" disabled={loading} className="btn-primary">
          {loading ? 'Saving...' : initial ? 'Save Changes' : 'Add Expense'}
        </button>
      </div>
    </form>
  );
};

export default ExpenseForm;
