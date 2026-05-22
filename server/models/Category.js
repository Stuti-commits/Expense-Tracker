const mongoose = require('mongoose');

/**
 * FIELD NAME REFERENCE (used consistently across Transaction + Budget):
 *   category._id         → ObjectId ref used in Transaction.categoryId and Budget.categoryId
 *   category.name        → display name
 *   category.icon        → emoji or icon string
 *   category.color       → hex color for UI
 *   category.isSystem    → true = shipped with app, false = user/group created
 *   category.createdBy   → null for system, User ObjectId for custom
 *   category.groupId     → null for personal, Group ObjectId for shared
 */
const categorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    icon: { type: String, default: '📦' },   // emoji works well for mobile
    color: { type: String, default: '#6366f1' },

    // Distinguishes seeded system categories from user-created ones
    isSystem: { type: Boolean, default: false },

    // null for system categories, set for user/group-created
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },

    // null = personal category, set = shared across a group
    groupId: { type: mongoose.Schema.Types.ObjectId, ref: 'Group', default: null },

    // Soft delete — never hard-delete categories (breaks historical transactions)
    isArchived: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Prevent duplicate category names within the same group (or personal scope)
categorySchema.index({ name: 1, groupId: 1, createdBy: 1 }, { unique: true });

module.exports = mongoose.model('Category', categorySchema);
