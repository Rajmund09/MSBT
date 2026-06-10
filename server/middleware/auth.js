const jwt = require('jsonwebtoken');
const db = require('../config/db');

const JWT_SECRET = process.env.JWT_SECRET || 'msbt-super-secure-jwt-key-2026';

/**
 * Middleware: Verify user JWT token on protected endpoints
 */
async function verifyToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer <Token>
  
  if (!token) {
    return res.status(401).json({ error: 'Access Denied: No Token Provided' });
  }

  try {
    const verified = jwt.verify(token, JWT_SECRET);
    
    // Check if user exists and is active
    const user = await db.get('SELECT status FROM users WHERE id = ?', [verified.id]);
    if (!user) {
      return res.status(401).json({ error: 'Access Denied: User no longer exists' });
    }
    if (user.status === 'suspended') {
      return res.status(403).json({ error: 'Access Denied: Your account has been suspended' });
    }

    req.user = verified; // { id, username, role, name }
    next();
  } catch (err) {
    res.status(403).json({ error: 'Access Denied: Invalid or Expired Token' });
  }
}

/**
 * Middleware: Enforce Role-Based Access Control (RBAC)
 * @param {Array<string>} allowedRoles - Roles permitted to execute action
 */
function requireRole(allowedRoles) {
  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      return res.status(401).json({ error: 'Access Denied: User role missing' });
    }
    
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ 
        error: `Access Denied: Role '${req.user.role}' does not have sufficient permissions.` 
      });
    }
    
    next();
  };
}

/**
 * Middleware: Enforce Granular Module Permissions
 * Owner bypasses all permission checks.
 * @param {string} moduleName - Module ID (e.g. 'customers', 'entries')
 * @param {string} action - Action (e.g. 'view', 'create', 'edit')
 */
function requirePermission(moduleName, action) {
  return async (req, res, next) => {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ error: 'Access Denied: User missing' });
    }

    if (req.user.role === 'Owner') {
      return next(); // Owner bypasses all granular permissions
    }

    try {
      // Fetch latest permissions from DB to allow instant revocation
      const user = await db.get('SELECT permissions FROM users WHERE id = ?', [req.user.id]);
      if (!user) return res.status(404).json({ error: 'User not found' });

      let perms = {};
      if (user.permissions) {
        try { perms = JSON.parse(user.permissions); } catch (e) {}
      }

      const modPerms = perms[moduleName] || [];
      if (!modPerms.includes(action)) {
        return res.status(403).json({ 
          error: `Access Denied: Missing '${action}' permission for '${moduleName}'` 
        });
      }

      next();
    } catch (err) {
      res.status(500).json({ error: 'Server error checking permissions' });
    }
  };
}

module.exports = {
  verifyToken,
  requireRole,
  requirePermission,
  JWT_SECRET
};
