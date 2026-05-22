const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/verifyToken');
const User        = require('../models/User');
const Transaction = require('../models/Transaction');
const Budget      = require('../models/Budget');
const Category    = require('../models/Category');

// ─────────────────────────────────────────────────────────────────────────────
// HELPER: resolve Firebase uid string → MongoDB User._id (ObjectId)
// Your User model uses field 'uid', not 'firebaseUid'
// ─────────────────────────────────────────────────────────────────────────────
const resolveUser = async (firebaseUid) => {
  const user = await User.findOne({ uid: firebaseUid }).lean();
  if (!user) throw new Error('User not found');
  return user;
};

// ─────────────────────────────────────────────────────────────────────────────
// HELPER: build a date range for a given month + year
// Used instead of $month/$year operators since Transaction has no month/year fields
// ─────────────────────────────────────────────────────────────────────────────
const monthRange = (month, year) => ({
  $gte: new Date(year, month - 1, 1),
  $lt:  new Date(year, month,     1),
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/dashboard/monthly-trend?year=2025
// Bar chart: monthly totals for income / expense broken down by month
// Note: your Transaction schema only has 'expense' | 'income' | 'transfer'
//       'transfer' is excluded — it's not real spending or earning
// ─────────────────────────────────────────────────────────────────────────────
router.get('/monthly-trend', verifyToken, async (req, res) => {
  try {
    const user = await resolveUser(req.user.uid);
    const year = parseInt(req.query.year) || new Date().getFullYear();

    const data = await Transaction.aggregate([
      {
        $match: {
          userId: user._id,
          type: { $in: ['expense', 'income'] },
          date: {
            $gte: new Date(year, 0, 1),
            $lt:  new Date(year + 1, 0, 1),
          },
        },
      },
      {
        $group: {
          _id: {
            month: { $month: '$date' },
            type:  '$type',
          },
          total: { $sum: '$amount' },
        },
      },
      { $sort: { '_id.month': 1 } },
    ]);

    // Reshape into array of 12 months
    const monthMap = {};
    for (let m = 1; m <= 12; m++) {
      monthMap[m] = { month: m, income: 0, expense: 0 };
    }
    data.forEach(({ _id, total }) => {
      if (monthMap[_id.month]) {
        monthMap[_id.month][_id.type] = total;
      }
    });

    res.json({ data: Object.values(monthMap) });
  } catch (err) {
    console.error('monthly-trend:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/dashboard/category-split?month=1&year=2025
// Pie chart: expense breakdown by category for a given month
// ─────────────────────────────────────────────────────────────────────────────
router.get('/category-split', verifyToken, async (req, res) => {
  try {
    const user  = await resolveUser(req.user.uid);
    const month = parseInt(req.query.month) || new Date().getMonth() + 1;
    const year  = parseInt(req.query.year)  || new Date().getFullYear();

    const data = await Transaction.aggregate([
      {
        $match: {
          userId: user._id,
          type: 'expense',
          date: monthRange(month, year),
        },
      },
      {
        $lookup: {
          from: 'categories',
          localField: 'categoryId',
          foreignField: '_id',
          as: 'category',
        },
      },
      { $unwind: { path: '$category', preserveNullAndEmpty: false } },
      {
        $group: {
          _id: {
            categoryId: '$categoryId',
            name:  '$category.name',
            color: '$category.color',
            icon:  '$category.icon',
          },
          total: { $sum: '$amount' },
        },
      },
      { $sort: { total: -1 } },
    ]);

    const result = data.map(({ _id, total }) => ({
      name:  _id.name  || 'Uncategorised',
      value: total,
      color: _id.color || '#888',
      icon:  _id.icon  || '📦',
    }));

    res.json({ data: result });
  } catch (err) {
    console.error('category-split:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/dashboard/spend-save-invest?months=6
// Stacked bar: last N months of expense vs income (savings = income - expense)
// Since Category has no type field, we use transaction type directly.
// 'save' is derived (not a transaction type) — computed as income minus expense per month.
// ─────────────────────────────────────────────────────────────────────────────
router.get('/spend-save-invest', verifyToken, async (req, res) => {
  try {
    const user   = await resolveUser(req.user.uid);
    const months = Math.min(parseInt(req.query.months) || 6, 12);

    // Build date range covering last N months
    const now   = new Date();
    const start = new Date(now.getFullYear(), now.getMonth() - (months - 1), 1);
    const end   = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    const data = await Transaction.aggregate([
      {
        $match: {
          userId: user._id,
          type: { $in: ['expense', 'income'] },
          date: { $gte: start, $lt: end },
        },
      },
      {
        $group: {
          _id: {
            year:  { $year:  '$date' },
            month: { $month: '$date' },
            type:  '$type',
          },
          total: { $sum: '$amount' },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]);

    // Build period buckets
    const periods = [];
    for (let i = months - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      periods.push({
        key:   `${d.getFullYear()}-${d.getMonth() + 1}`,
        label: d.toLocaleString('default', { month: 'short', year: '2-digit' }),
        income:  0,
        expense: 0,
      });
    }

    const periodMap = Object.fromEntries(periods.map(p => [p.key, p]));

    data.forEach(({ _id, total }) => {
      const key = `${_id.year}-${_id.month}`;
      if (periodMap[key]) periodMap[key][_id.type] = total;
    });

    // Add derived 'savings' = income - expense (floor 0)
    const result = Object.values(periodMap).map(p => ({
      ...p,
      savings: Math.max(0, p.income - p.expense),
    }));

    res.json({ data: result });
  } catch (err) {
    console.error('spend-save-invest:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/dashboard/budget-status?month=1&year=2025
// Budget overshoot alerts: actual spend per category vs Budget.amount
// Your Budget model: flat amount per categoryId + month + year
// categoryId=null means "overall monthly budget"
// ─────────────────────────────────────────────────────────────────────────────
router.get('/budget-status', verifyToken, async (req, res) => {
  try {
    const user  = await resolveUser(req.user.uid);
    const month = parseInt(req.query.month) || new Date().getMonth() + 1;
    const year  = parseInt(req.query.year)  || new Date().getFullYear();

    // 1. All budgets for this user + month (personal budgets only, groupId=null)
    const budgets = await Budget.find({
      userId: user._id,
      groupId: null,
      month,
      year,
    }).lean();

    if (!budgets.length) {
      return res.json({ hasBudget: false, message: 'No budget set for this month' });
    }

    // 2. Actual spend per category this month
    const spendData = await Transaction.aggregate([
      {
        $match: {
          userId: user._id,
          type: 'expense',
          date: monthRange(month, year),
        },
      },
      {
        $group: {
          _id: '$categoryId',
          total: { $sum: '$amount' },
        },
      },
    ]);

    // Map categoryId → actual spend
    const spendMap = {};
    spendData.forEach(({ _id, total }) => {
      spendMap[_id ? _id.toString() : 'null'] = total;
    });

    // Total spend (for overall budget row)
    const totalSpend = spendData.reduce((sum, s) => sum + s.total, 0);

    // 3. Fetch category names for display
    const categoryIds = budgets
      .filter(b => b.categoryId)
      .map(b => b.categoryId);

    const categories = await Category.find({ _id: { $in: categoryIds } }).lean();
    const catMap = Object.fromEntries(categories.map(c => [c._id.toString(), c]));

    // 4. Build alert objects
    const alerts = budgets.map((budget) => {
      const isOverall = !budget.categoryId;
      const key       = isOverall ? 'null' : budget.categoryId.toString();
      const spent     = isOverall ? totalSpend : (spendMap[key] || 0);
      const limit     = budget.amount;
      const pct       = limit > 0 ? Math.round((spent / limit) * 100) : 0;
      const threshold = (budget.alertThreshold || 0.8) * 100;

      let status = 'ok';
      if (pct >= 100)       status = 'over';
      else if (pct >= threshold) status = 'warning';

      const cat = isOverall ? null : catMap[key];

      return {
        categoryId: key,
        label:     isOverall ? 'Overall Budget' : (cat?.name || 'Unknown'),
        color:     cat?.color || '#6366f1',
        icon:      cat?.icon  || '📦',
        spent,
        limit,
        pct,
        status,
        overshoot: Math.max(0, spent - limit),
      };
    });

    // Sort: over → warning → ok, then by pct desc
    alerts.sort((a, b) => {
      const rank = { over: 0, warning: 1, ok: 2 };
      return rank[a.status] - rank[b.status] || b.pct - a.pct;
    });

    res.json({
      hasBudget: true,
      month,
      year,
      alerts,
    });
  } catch (err) {
    console.error('budget-status:', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
