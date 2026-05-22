const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/verifyToken');
const Category = require('../models/Category');
const User = require('../models/User');

router.use(verifyToken);

const getMongoUser = async (firebaseUid) => {
  const user = await User.findOne({ uid: firebaseUid });
  if (!user) throw new Error('User not found — call /auth/sync first');
  return user;
};

// System categories seeded on first use
const SYSTEM_CATEGORIES = [
  { name: 'Food & Dining',    icon: '🍽️',  color: '#f97316' },
  { name: 'Rent & Housing',   icon: '🏠',  color: '#8b5cf6' },
  { name: 'Transport',        icon: '🚗',  color: '#3b82f6' },
  { name: 'Groceries',        icon: '🛒',  color: '#22c55e' },
  { name: 'Entertainment',    icon: '🎬',  color: '#ec4899' },
  { name: 'Healthcare',       icon: '💊',  color: '#14b8a6' },
  { name: 'Shopping',         icon: '🛍️',  color: '#f59e0b' },
  { name: 'Utilities',        icon: '💡',  color: '#64748b' },
  { name: 'Education',        icon: '📚',  color: '#0ea5e9' },
  { name: 'Salary',           icon: '💰',  color: '#10b981' },
  { name: 'Investments',      icon: '📈',  color: '#6366f1' },
  { name: 'Other',            icon: '📦',  color: '#94a3b8' },
];

// ─── GET /api/categories ────────────────────────────────────────────────────
// Returns system categories + user's custom categories + group categories
router.get('/', async (req, res) => {
  try {
    const user = await getMongoUser(req.user.uid);
    const { groupId } = req.query;

    // Seed system categories if not already in DB (idempotent)
    const systemCount = await Category.countDocuments({ isSystem: true });
    if (systemCount === 0) {
      await Category.insertMany(
        SYSTEM_CATEGORIES.map((c) => ({ ...c, isSystem: true, createdBy: null, groupId: null }))
      );
    }

    const filter = {
      isArchived: false,
      $or: [
        { isSystem: true },
        { createdBy: user._id },
      ],
    };

    if (groupId) {
      filter.$or.push({ groupId });
    }

    const categories = await Category.find(filter).sort({ isSystem: -1, name: 1 });
    res.json({ categories });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── POST /api/categories ───────────────────────────────────────────────────
router.post('/', async (req, res) => {
  try {
    const user = await getMongoUser(req.user.uid);
    const { name, icon, color, groupId } = req.body;

    if (!name) return res.status(400).json({ error: 'Category name is required' });

    const category = await Category.create({
      name,
      icon: icon || '📦',
      color: color || '#6366f1',
      isSystem: false,
      createdBy: user._id,
      groupId: groupId || null,
    });

    res.status(201).json({ category });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ error: 'A category with this name already exists' });
    }
    res.status(500).json({ error: err.message });
  }
});

// ─── PUT /api/categories/:id ────────────────────────────────────────────────
router.put('/:id', async (req, res) => {
  try {
    const user = await getMongoUser(req.user.uid);
    const category = await Category.findById(req.params.id);

    if (!category) return res.status(404).json({ error: 'Category not found' });
    if (category.isSystem) return res.status(403).json({ error: 'Cannot edit system categories' });
    if (category.createdBy.toString() !== user._id.toString()) {
      return res.status(403).json({ error: 'Not authorized to edit this category' });
    }

    const { name, icon, color } = req.body;
    if (name) category.name = name;
    if (icon) category.icon = icon;
    if (color) category.color = color;

    await category.save();
    res.json({ category });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── DELETE /api/categories/:id ─────────────────────────────────────────────
// Soft archive — never hard delete (breaks historical transactions)
router.delete('/:id', async (req, res) => {
  try {
    const user = await getMongoUser(req.user.uid);
    const category = await Category.findById(req.params.id);

    if (!category) return res.status(404).json({ error: 'Category not found' });
    if (category.isSystem) return res.status(403).json({ error: 'Cannot delete system categories' });
    if (category.createdBy.toString() !== user._id.toString()) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    category.isArchived = true;
    await category.save();
    res.json({ message: 'Category archived' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
