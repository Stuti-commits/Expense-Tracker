const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const verifyToken = require('../middleware/verifyToken');
const Transaction = require('../models/Transaction');
const User = require('../models/User');

// All transaction routes require auth
router.use(verifyToken);

// Helper: resolve Firebase uid → MongoDB User._id
const getMongoUser = async (firebaseUid) => {
  const user = await User.findOne({ uid: firebaseUid });
  if (!user) throw new Error('User not found in DB — call /auth/sync first');
  return user;
};

// ─── GET /api/transactions ──────────────────────────────────────────────────
// Query params: groupId, categoryId, month, year, type, page, limit
router.get('/', async (req, res) => {
  try {
    const user = await getMongoUser(req.user.uid);
    const { groupId, categoryId, month, year, type, page = 1, limit = 20 } = req.query;

    const filter = {};

    // Scope: group or personal
    if (groupId) {
      filter.groupId = groupId;
    } else {
      filter.userId = user._id;
      filter.groupId = null;
    }

    if (categoryId) filter.categoryId = categoryId;
    if (type) filter.type = type;

    // Filter by month/year using date range
    if (month && year) {
      const start = new Date(year, month - 1, 1);
      const end = new Date(year, month, 1);
      filter.date = { $gte: start, $lt: end };
    }

    const total = await Transaction.countDocuments(filter);
    const transactions = await Transaction.find(filter)
      .populate('categoryId', 'name icon color')
      .populate('userId', 'displayName email')
      .sort({ date: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.json({
      transactions,
      pagination: { total, page: Number(page), limit: Number(limit), pages: Math.ceil(total / limit) },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── POST /api/transactions ─────────────────────────────────────────────────
router.post('/', async (req, res) => {
  try {
    const user = await getMongoUser(req.user.uid);
    const { amount, type, categoryId, groupId, date, description, paymentMode, tags } = req.body;

    // Basic validation
    if (!amount || !categoryId) {
      return res.status(400).json({ error: 'amount and categoryId are required' });
    }

    const transaction = await Transaction.create({
      amount,
      type: type || 'expense',
      categoryId,
      userId: user._id,
      groupId: groupId || null,
      date: date ? new Date(date) : new Date(),
      description,
      paymentMode,
      tags,
    });

    const populated = await transaction.populate('categoryId', 'name icon color');
    res.status(201).json({ transaction: populated });
  } catch (err) {
    if (err.name === 'ValidationError') {
      return res.status(400).json({ error: err.message });
    }
    res.status(500).json({ error: err.message });
  }
});

// ─── GET /api/transactions/:id ──────────────────────────────────────────────
router.get('/:id', async (req, res) => {
  try {
    const user = await getMongoUser(req.user.uid);
    const transaction = await Transaction.findById(req.params.id)
      .populate('categoryId', 'name icon color')
      .populate('userId', 'displayName email');

    if (!transaction) return res.status(404).json({ error: 'Transaction not found' });

    // Ownership check
    if (transaction.userId.toString() !== user._id.toString()) {
      return res.status(403).json({ error: 'Not authorized to view this transaction' });
    }

    res.json({ transaction });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── PUT /api/transactions/:id ──────────────────────────────────────────────
router.put('/:id', async (req, res) => {
  try {
    const user = await getMongoUser(req.user.uid);
    const transaction = await Transaction.findById(req.params.id);

    if (!transaction) return res.status(404).json({ error: 'Transaction not found' });
    if (transaction.userId.toString() !== user._id.toString()) {
      return res.status(403).json({ error: 'Not authorized to edit this transaction' });
    }

    const allowed = ['amount', 'type', 'categoryId', 'date', 'description', 'paymentMode', 'tags'];
    allowed.forEach((field) => {
      if (req.body[field] !== undefined) transaction[field] = req.body[field];
    });

    await transaction.save();
    const populated = await transaction.populate('categoryId', 'name icon color');
    res.json({ transaction: populated });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── DELETE /api/transactions/:id ───────────────────────────────────────────
// Soft delete — preserves history, budget calculations stay accurate
router.delete('/:id', async (req, res) => {
  try {
    const user = await getMongoUser(req.user.uid);
    const transaction = await Transaction.findById(req.params.id);

    if (!transaction) return res.status(404).json({ error: 'Transaction not found' });
    if (transaction.userId.toString() !== user._id.toString()) {
      return res.status(403).json({ error: 'Not authorized to delete this transaction' });
    }

    transaction.isDeleted = true;
    transaction.deletedAt = new Date();
    await transaction.save();

    res.json({ message: 'Transaction deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
