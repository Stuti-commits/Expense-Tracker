const admin = require('../config/firebase');

/**
 * Verifies the Firebase ID token sent in the Authorization header.
 * Firebase issues its own JWTs — we verify them, not generate them.
 *
 * Client must send: Authorization: Bearer <firebase-id-token>
 * Get the token client-side via: firebase.auth().currentUser.getIdToken()
 */
const verifyToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or malformed Authorization header' });
  }

  const token = authHeader.split('Bearer ')[1];

  try {
    // Firebase Admin verifies signature, expiry, and issuer
    const decodedToken = await admin.auth().verifyIdToken(token);
    req.user = decodedToken; // { uid, email, name, ... }
    next();
  } catch (err) {
    console.error('Token verification failed:', err.code);

    if (err.code === 'auth/id-token-expired') {
      return res.status(401).json({ error: 'Token expired — client must refresh' });
    }

    return res.status(403).json({ error: 'Invalid token' });
  }
};

module.exports = verifyToken;
