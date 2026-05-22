const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/verifyToken');
const Budget = require('../models/Budget');
const Transaction = require('../models/Transaction');
const User = require('../models/User');

router.use(verifyToken);

const getMongoUser = async (uid) => {
  const user = await User.findOne({ uid });
  if (!user) throw new Error('User not found — call /auth/sync first');
  return user;
};

// ─── GET /api/budgets?month=6&year=2025&groupId=xxx ─────────────────────────
// Returns budgets with actual spend calculated via aggregation
router.get('/', async (req, res) => {
  try {
    const user = await getMongoUser(req.user.uid);
    const { month, year, groupId } = req.query;

    if (!month || !year) return res.status(400).json({ error: 'month and year are required' });

    const filter = { month: Number(month), year: Number(year) };
    groupId ? (filter.groupId = groupId) : (filter.userId = user._id);

    const budgets = await Budget.find(filter).populate('categoryId', 'name icon color');

    // Calculate actual spend for each budget in one aggregation
    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 1);

    const spendByCategory = await Transaction.aggregate([
      {
        $match: {
          ...(groupId ? { groupId: require('mongoose').Types.ObjectId(groupId) } : { userId: user._id }),
          type: 'expense',
          date: { $gte: start, $lt: end },
          isDeleted: false,
        },
      },
      { $group: { _id: '$categoryId', spent: { $sum: '$amount' } } },
    ]);

    const spendMap = {};
    spendByCategory.forEach((s) => { spendMap[s._id?.toString()] = s.spent; });

    // Total spend for overall budget
    const totalSpent = spendByCategory.reduce((sum, s) => sum + s.spent, 0);

    const enriched = budgets.map((b) => {
      const spent = b.categoryId ? (spendMap[b.categoryId._id?.toString()] || 0) : totalSpent;
      return {
        ...b.toObject(),
        spent,
        remaining: b.amount - spent,
        percentUsed: Math.round((spent / b.amount) * 100),
        isOverBudget: spent > b.amount,
        isNearLimit: spent / b.amount >= b.alertThreshold && spent <= b.amount,
      };
    });

    res.json({ budgets: enriched });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── POST /api/budgets ──────────────────────────────────────────────────────
router.post('/', async (req, res) => {
  try {
    const user = await getMongoUser(req.user.uid);
    const { categoryId, amount, month, year, groupId, alertThreshold } = req.body;

    if (!amount || !month || !year) {
      return res.status(400).json({ error: 'amount, month, and year are required' });
    }

    const budget = await Budget.findOneAndUpdate(
      // Match key — upsert so setting a budget twice just updates it
      { categoryId: categoryId || null, month, year, ...(groupId ? { groupId } : { userId: user._id }) },
      { amount, alertThreshold },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    res.status(201).json({ budget });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── DELETE /api/budgets/:id ─────────────────────────────────────────────────
router.delete('/:id', async (req, res) => {
  try {
    const user = await getMongoUser(req.user.uid);
    const budget = await Budget.findById(req.params.id);

    if (!budget) return res.status(404).json({ error: 'Budget not found' });
    if (budget.userId?.toString() !== user._id.toString()) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    await budget.deleteOne();
    res.json({ message: 'Budget deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
