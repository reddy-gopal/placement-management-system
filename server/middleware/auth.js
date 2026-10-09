const jwt = require('jsonwebtoken');

// Fixed identity used when AUTH_DISABLED=true (development only).
const DEFAULT_DEV_USER_ID = '000000000000000000000001';

function isAuthDisabled() {
  return process.env.AUTH_DISABLED === 'true' && process.env.NODE_ENV !== 'production';
}

function devUser() {
  return { id: process.env.DEV_USER_ID || DEFAULT_DEV_USER_ID, role: 'STUDENT', email: 'dev.student@example.com' };
}

/**
 * Verifies the Bearer JWT and (optionally) the caller's role.
 * Implements the contract in docs/02-rbac-permission-matrix.md:
 * on success, req.user = { id, role, email }.
 *
 * With AUTH_DISABLED=true (never in production) every request acts as a
 * single dev student, so the UI can be used before the login module exists.
 */
function requireAuth(allowedRoles = []) {
  return (req, res, next) => {
    if (isAuthDisabled()) {
      req.user = devUser();
      return next();
    }

    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const token = authHeader.split(' ')[1];
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = decoded; // { id, role, email }

      if (allowedRoles.length && !allowedRoles.includes(decoded.role)) {
        return res
          .status(403)
          .json({ success: false, message: 'Forbidden: Insufficient permissions' });
      }
      next();
    } catch (err) {
      return res.status(401).json({ success: false, message: 'Invalid or expired token' });
    }
  };
}

module.exports = { requireAuth, isAuthDisabled, devUser };
