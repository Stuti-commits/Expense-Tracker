const mongoose = require('mongoose');

/**
 * FIELD NAME REFERENCE (single source of truth — match these exactly in UI + API):
 *   transaction.amount      → always positive Number (type determines direction)
 *   transaction.type        → 'expense' | 'income' | 'transfer'
 *   transaction.categoryId  → ref to Category._id
 *   transaction.userId      → who entered it (ref to User._id, NOT Firebase uid string)
 *   transaction.groupId     → null for personal, Group._id for shared
 *   transaction.date        → actual transaction date (not createdAt)
 *   transaction.description → free text note
 *   transaction.paymentMode → cash | upi | card | netbanking | other
 *   transaction.tags        → array of strings for flexible filtering
 *   transaction.isRecurring → flag for future recurring support
 */
const transactionSchema = new mongoose.Schema(
  {
    amount: {
      type: Number,
      required: true,
      min: [0.01, 'Amount must be greater than 0'],
    },

    type: {
      type: String,
      required: true,
      enum: ['expense', 'income', 'transfer'],
      default: 'expense',
    },

    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: true,
    },

    // User who created this record
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    // null = personal expense, set = shared group expense
    groupId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Group',
      default: null,
    },

    // Actual date of transaction — user can backdate
    date: {
      type: Date,
      required: true,
      default: Date.now,
    },

    description: {
      type: String,
      trim: true,
      maxlength: 500,
    },

    paymentMode: {
      type: String,
      enum: ['cash', 'upi', 'card', 'netbanking', 'other'],
      default: 'upi',
    },

    tags: [{ type: String, trim: true, lowercase: true }],

    // Placeholder for recurring expense feature
    isRecurring: { type: Boolean, default: false },
    recurringId: { type: mongoose.Schema.Types.ObjectId, default: null },

    // Soft delete
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

// Indexes for the queries you'll actually run
transactionSchema.index({ userId: 1, date: -1 });           // personal feed
transactionSchema.index({ groupId: 1, date: -1 });          // group feed
transactionSchema.index({ categoryId: 1, date: -1 });       // category drill-down
transactionSchema.index({ userId: 1, categoryId: 1, date: -1 }); // budget vs actual

// Exclude soft-deleted by default
transactionSchema.pre(/^find/, function (next) {
  if (this.getFilter().isDeleted === undefined) {
    this.where({ isDeleted: false });
  }
  next();
});

module.exports = mongoose.model('Transaction', transactionSchema);
