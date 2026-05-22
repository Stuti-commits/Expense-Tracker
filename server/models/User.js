const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    uid: { type: String, required: true, unique: true }, // Firebase UID
    email: { type: String, required: true, lowercase: true, trim: true },
    displayName: { type: String, trim: true },
    role: { type: String, enum: ['user', 'admin'], default: 'user' },

    // Multi-user: which groups this user belongs to
    groupIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Group' }],

    // Default currency preference
    currency: { type: String, default: 'INR' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', userSchema);
