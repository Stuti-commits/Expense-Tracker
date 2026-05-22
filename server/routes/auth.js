const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/verifyToken');
const User = require('../models/User');

/**
 * POST /api/auth/sync
 * Called after successful Firebase login/signup on the client.
 * Creates or updates the user record in MongoDB.
 * Protected — requires valid Firebase token.
 */
router.post('/sync', verifyToken, async (req, res) => {
  const { uid, email, name } = req.user; // From decoded Firebase token

  try {
    const user = await User.findOneAndUpdate(
      { uid },
      { uid, email, displayName: name || '' },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    res.json({ user });
  } catch (err) {
    console.error('User sync error:', err.message);
    res.status(500).json({ error: 'Failed to sync user' });
  }
});

/**
 * GET /api/auth/me
 * Returns the MongoDB user record for the authenticated Firebase user.
 */
router.get('/me', verifyToken, async (req, res) => {
  try {
    const user = await User.findOne({ uid: req.user.uid });

    if (!user) {
      return res.status(404).json({ error: 'User not found — call /sync first' });
    }

    res.json({ user });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
