const mongoose = require('mongoose');

/**
 * A Group is a shared space (e.g. family, roommates, team).
 * Transactions and Budgets can be scoped to a group instead of a single user.
 * A user can belong to multiple groups.
 */
const groupSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },

    // The user who created the group — has admin rights over it
    ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

    // All members including owner
    members: [
      {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        role: { type: String, enum: ['owner', 'admin', 'member'], default: 'member' },
        joinedAt: { type: Date, default: Date.now },
      },
    ],

    currency: { type: String, default: 'INR' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Group', groupSchema);
