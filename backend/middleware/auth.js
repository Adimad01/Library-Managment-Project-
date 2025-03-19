// backend/middleware/auth.js
const jwt = require('jsonwebtoken');

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Expecting "Bearer <token>"

  if (!token) {
    return res.status(401).json({ message: 'Access denied. No token provided.' });
  }

  if (!process.env.JWT_SECRET) {
    console.error('JWT_SECRET is missing in environment variables.');
    return res.status(500).json({ message: 'Server error: missing JWT secret' });
  }

  // (Debug: log the secret; remove in production)
  console.log('Using JWT_SECRET:', process.env.JWT_SECRET);

  jwt.verify(token, process.env.JWT_SECRET, (err, decodedUser) => {
    if (err) {
      console.error('Token verification error:', err.message);
      return res.status(403).json({ message: 'Invalid or expired token. Please log in again.' });
    }
    req.user = decodedUser; // decodedUser should be { id, role, iat, exp }
    next();
  });
}

function isAdmin(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ message: 'Unauthorized: No user data found.' });
  }
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied. Only admins can perform this action.' });
  }
  next();
}

module.exports = { authenticateToken, isAdmin };
