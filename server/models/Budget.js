const mongoose = require('mongoose');

/**
 * FIELD NAME REFERENCE:
 *   budget.categoryId  → null means "overall budget", Category._id means category-specific
 *   budget.userId      → personal budget owner (null if group budget)
 *   budget.groupId     → null for personal, Group._id for shared budget
 *   budget.amount      → budget limit in the user/group's currency
 *   budget.month       → 1–12
 *   budget.year        → e.g. 2025
 *
 * A budget row is uniquely identified by:
 *   (userId OR groupId) + categoryId (or null) + month + year
 *
 * To check if user is over budget:
 *   SUM(Transaction.amount WHERE categoryId=X AND month=M AND year=Y) vs budget.amount
 */
const budgetSchema = new mongoose.Schema(
  {
    // null = "overall budget for the month", Category._id = category-specific
    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      default: null,
    },

    // Exactly one of userId or groupId must be set
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    groupId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Group',
      default: null,
    },

    amount: {
      type: Number,
      required: true,
      min: [1, 'Budget must be at least 1'],
    },

    month: {
      type: Number,
      required: true,
      min: 1,
      max: 12,
    },

    year: {
      type: Number,
      required: true,
      min: 2000,
    },

    // Optional: alert threshold (e.g. 0.8 = alert when 80% spent)
    alertThreshold: {
      type: Number,
      default: 0.8,
      min: 0,
      max: 1,
    },
  },
  { timestamps: true }
);

// Enforce uniqueness: one budget row per scope + category + month + year
budgetSchema.index(
  { userId: 1, groupId: 1, categoryId: 1, month: 1, year: 1 },
  { unique: true }
);

// Validate: must have either userId or groupId, not both, not neither
budgetSchema.pre('save', function (next) {
  if (!this.userId && !this.groupId) {
    return next(new Error('Budget must belong to a user or a group'));
  }
  if (this.userId && this.groupId) {
    return next(new Error('Budget cannot belong to both a user and a group'));
  }
  next();
});

module.exports = mongoose.model('Budget', budgetSchema);
