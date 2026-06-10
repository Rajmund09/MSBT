const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');
const { JWT_SECRET } = require('../middleware/auth');

const genId = (prefix = 'id') => `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

exports.login = async (req, res) => {
  const { username, password, remember } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }
  try {
    const user = await db.get('SELECT * FROM users WHERE username = ?', [username]);
    if (!user) return res.status(401).json({ error: 'Invalid username or password' });
    if (user.status === 'suspended') return res.status(403).json({ error: 'This account has been suspended' });

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) return res.status(401).json({ error: 'Invalid username or password' });

    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role, name: user.full_name },
      JWT_SECRET,
      { expiresIn: remember ? '30d' : '12h' }
    );

    await db.run(
      'INSERT INTO audit_logs (id, user_id, action, details, ip_address) VALUES (?, ?, ?, ?, ?)',
      [genId('audit'), user.id, 'USER_LOGIN', `User ${username} logged in`, req.ip]
    );

    let perms = {};
    if (user.permissions) {
      try { perms = JSON.parse(user.permissions); } catch(e){}
    }

    res.json({
      token,
      user: { id: user.id, username: user.username, role: user.role, full_name: user.full_name, phone: user.phone, permissions: perms }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Server error during login' });
  }
};

exports.logout = async (req, res) => {
  try {
    await db.run(
      'INSERT INTO audit_logs (id, user_id, action, details, ip_address) VALUES (?, ?, ?, ?, ?)',
      [genId('audit'), req.user.id, 'USER_LOGOUT', `User ${req.user.username} logged out`, req.ip]
    );
    res.json({ message: 'Logged out successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Logout error' });
  }
};

exports.getCurrentUser = async (req, res) => {
  try {
    const user = await db.get(
      'SELECT id, username, role, full_name, phone, status, permissions, profile_photo, created_at FROM users WHERE id = ?',
      [req.user.id]
    );
    if (!user) return res.status(404).json({ error: 'User not found' });
    if (user.permissions) {
      try { user.permissions = JSON.parse(user.permissions); } catch (e) {}
    }
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve current user' });
  }
};

exports.getAllUsers = async (req, res) => {
  try {
    const users = await db.query(
      'SELECT id, username, role, full_name, phone, status, permissions, profile_photo, created_at FROM users ORDER BY created_at ASC'
    );
    users.forEach(u => {
      if (u.permissions) {
        try { u.permissions = JSON.parse(u.permissions); } catch(e){}
      }
    });
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
};

exports.registerUser = async (req, res) => {
  const { username, password, role, fullName, phone, permissions } = req.body;
  if (!username || !password || !role || !fullName) {
    return res.status(400).json({ error: 'Username, password, role and full name are required' });
  }
  const validRoles = ['Owner', 'Co-Owner', 'Manager', 'Accountant', 'Employee'];
  if (!validRoles.includes(role)) {
    return res.status(400).json({ error: 'Invalid role' });
  }

  try {
    const existing = await db.get('SELECT id FROM users WHERE username = ?', [username]);
    if (existing) return res.status(409).json({ error: 'Username already taken' });

    const hash = await bcrypt.hash(password, 10);
    const id = genId('user');

    const permsStr = permissions ? JSON.stringify(permissions) : null;
    await db.run(
      'INSERT INTO users (id, username, password_hash, role, full_name, phone, status, permissions) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [id, username, hash, role, fullName, phone || '', 'active', permsStr]
    );

    await db.run(
      'INSERT INTO audit_logs (id, user_id, action, target_table, target_id, details, ip_address) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [genId('audit'), req.user.id, 'CREATE_USER', 'users', id, `Created user ${username} with role ${role}`, req.ip]
    );

    res.status(201).json({ id, username, role, full_name: fullName, phone, status: 'active', permissions });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Failed to create user' });
  }
};

exports.updateUser = async (req, res) => {
  const { id } = req.params;
  const { role, fullName, phone, status, permissions } = req.body;
  try {
    const user = await db.get('SELECT * FROM users WHERE id = ?', [id]);
    if (!user) return res.status(404).json({ error: 'User not found' });
    // Prevent Owner from demoting themselves
    if (user.id === req.user.id && role && role !== user.role) {
      return res.status(400).json({ error: 'You cannot change your own role' });
    }

    const permsStr = permissions !== undefined ? JSON.stringify(permissions) : user.permissions;
    const photo = req.body.profile_photo !== undefined ? req.body.profile_photo : user.profile_photo;
    
    await db.run(
      'UPDATE users SET role = ?, full_name = ?, phone = ?, status = ?, permissions = ?, profile_photo = ? WHERE id = ?',
      [role || user.role, fullName || user.full_name, phone || user.phone, status || user.status, permsStr, photo, id]
    );

    await db.run(
      'INSERT INTO audit_logs (id, user_id, action, target_table, target_id, details, ip_address) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [genId('audit'), req.user.id, 'UPDATE_USER', 'users', id, `Updated user ${user.username}`, req.ip]
    );

    res.json({ id, username: user.username, role: role || user.role, full_name: fullName || user.full_name, status: status || user.status, permissions: permissions || JSON.parse(user.permissions || "{}") });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update user' });
  }
};

exports.deleteUser = async (req, res) => {
  const { id } = req.params;
  if (id === req.user.id) {
    return res.status(400).json({ error: 'You cannot delete your own account' });
  }
  try {
    const user = await db.get('SELECT * FROM users WHERE id = ?', [id]);
    if (!user) return res.status(404).json({ error: 'User not found' });

    await db.run('UPDATE users SET status = ? WHERE id = ?', ['suspended', id]);

    await db.run(
      'INSERT INTO audit_logs (id, user_id, action, target_table, target_id, details, ip_address) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [genId('audit'), req.user.id, 'DELETE_USER', 'users', id, `Suspended user ${user.username}`, req.ip]
    );

    res.json({ message: 'User suspended', id });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete user' });
  }
};

exports.hardDeleteUser = async (req, res) => {
  const { id } = req.params;
  if (id === req.user.id) {
    return res.status(400).json({ error: 'You cannot delete your own account' });
  }
  try {
    const user = await db.get('SELECT * FROM users WHERE id = ?', [id]);
    if (!user) return res.status(404).json({ error: 'User not found' });
    if (user.role === 'Owner') return res.status(400).json({ error: 'Cannot delete the Owner account' });

    await db.run('DELETE FROM users WHERE id = ?', [id]);

    await db.run(
      'INSERT INTO audit_logs (id, user_id, action, target_table, target_id, details, ip_address) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [genId('audit'), req.user.id, 'HARD_DELETE_USER', 'users', id, `Permanently deleted user ${user.username}`, req.ip]
    );

    res.json({ message: 'User permanently deleted', id });
  } catch (err) {
    res.status(500).json({ error: 'Failed to permanently delete user' });
  }
};

exports.updateProfile = async (req, res) => {
  const { fullName, phone, profile_photo, password } = req.body;
  try {
    const user = await db.get('SELECT * FROM users WHERE id = ?', [req.user.id]);
    if (!user) return res.status(404).json({ error: 'User not found' });
    
    let hash = user.password_hash;
    if (password) {
      hash = await bcrypt.hash(password, 10);
    }
    
    const photo = profile_photo !== undefined ? profile_photo : user.profile_photo;
    
    await db.run(
      'UPDATE users SET full_name = ?, phone = ?, profile_photo = ?, password_hash = ? WHERE id = ?',
      [fullName || user.full_name, phone || user.phone, photo, hash, req.user.id]
    );
    
    await db.run(
      'INSERT INTO audit_logs (id, user_id, action, details, ip_address) VALUES (?, ?, ?, ?, ?)',
      [genId('audit'), req.user.id, 'UPDATE_PROFILE', `User ${user.username} updated their profile`, req.ip]
    );

    res.json({ success: true });
  } catch (err) {
    console.error('Update profile error:', err);
    res.status(500).json({ error: 'Failed to update profile' });
  }
};
