const db = require('../config/db');

// Helper to generate a random ID
const genId = (prefix = 'id') => `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

/**
 * Create a new task/reminder
 */
exports.createTask = async (req, res) => {
  const { title, description, due_date, due_time, assigned_to, customer_id } = req.body;

  if (!title || !due_date) {
    return res.status(400).json({ error: 'Title and due date are required' });
  }

  const id = genId('task');
  try {
    await db.run(
      `INSERT INTO tasks (id, title, description, due_date, due_time, assigned_to, customer_id, status, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', ?)`,
      [id, title, description || '', due_date, due_time || null, assigned_to || null, customer_id || null, req.user.id]
    );

    // Audit Log
    await db.run(
      'INSERT INTO audit_logs (id, user_id, action, target_table, target_id, details, ip_address) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [genId('audit'), req.user.id, 'CREATE_TASK', 'tasks', id, `Created task: "${title}"`, req.ip]
    );

    res.status(201).json({ id, title, description, due_date, due_time, assigned_to, customer_id, status: 'pending' });
  } catch (err) {
    console.error('Create task error:', err);
    res.status(500).json({ error: 'Failed to create task' });
  }
};

/**
 * Update an existing task
 */
exports.updateTask = async (req, res) => {
  const { id } = req.params;
  const { title, description, due_date, due_time, assigned_to, customer_id, status } = req.body;

  if (!title || !due_date) {
    return res.status(400).json({ error: 'Title and due date are required' });
  }

  try {
    const existing = await db.get('SELECT * FROM tasks WHERE id = ?', [id]);
    if (!existing) {
      return res.status(404).json({ error: 'Task not found' });
    }

    await db.run(
      `UPDATE tasks 
       SET title = ?, description = ?, due_date = ?, due_time = ?, assigned_to = ?, customer_id = ?, status = ?
       WHERE id = ?`,
      [title, description || '', due_date, due_time || null, assigned_to || null, customer_id || null, status || 'pending', id]
    );

    // Audit Log
    await db.run(
      'INSERT INTO audit_logs (id, user_id, action, target_table, target_id, details, ip_address) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [genId('audit'), req.user.id, 'UPDATE_TASK', 'tasks', id, `Updated task: "${title}"`, req.ip]
    );

    res.json({ id, title, description, due_date, due_time, assigned_to, customer_id, status });
  } catch (err) {
    console.error('Update task error:', err);
    res.status(500).json({ error: 'Failed to update task' });
  }
};

/**
 * Delete a task
 */
exports.deleteTask = async (req, res) => {
  const { id } = req.params;

  try {
    const existing = await db.get('SELECT * FROM tasks WHERE id = ?', [id]);
    if (!existing) {
      return res.status(404).json({ error: 'Task not found' });
    }

    await db.run('DELETE FROM tasks WHERE id = ?', [id]);

    // Audit Log
    await db.run(
      'INSERT INTO audit_logs (id, user_id, action, target_table, target_id, details, ip_address) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [genId('audit'), req.user.id, 'DELETE_TASK', 'tasks', id, `Deleted task: "${existing.title}"`, req.ip]
    );

    res.json({ success: true, message: 'Task deleted successfully' });
  } catch (err) {
    console.error('Delete task error:', err);
    res.status(500).json({ error: 'Failed to delete task' });
  }
};

/**
 * Get aggregated calendar events (tasks, payments, entries) for a date range
 */
exports.getCalendarEvents = async (req, res) => {
  const { startDate, endDate } = req.query;

  if (!startDate || !endDate) {
    return res.status(400).json({ error: 'startDate and endDate query parameters are required (YYYY-MM-DD)' });
  }

  try {
    // 1. Fetch tasks
    const tasks = await db.query(
      `SELECT t.*, u.full_name as assignee_name, c.name as customer_name
       FROM tasks t
       LEFT JOIN users u ON t.assigned_to = u.id
       LEFT JOIN customers c ON t.customer_id = c.id
       WHERE t.due_date BETWEEN ? AND ?
       ORDER BY t.due_date ASC, t.due_time ASC`,
      [startDate, endDate]
    );

    // 2. Fetch payments
    const payments = await db.query(
      `SELECT p.id, p.amount, p.payment_mode, p.payment_date, c.name as customer_name, p.customer_id
       FROM payments p
       LEFT JOIN customers c ON p.customer_id = c.id
       WHERE p.payment_date BETWEEN ? AND ?
       ORDER BY p.payment_date ASC, p.created_at ASC`,
      [startDate, endDate]
    );

    // 3. Fetch entries
    const entries = await db.query(
      `SELECT e.id, e.entry_type, e.total_amount, e.entry_date, e.quantity, e.rate, c.name as customer_name, e.customer_id
       FROM entries e
       LEFT JOIN customers c ON e.customer_id = c.id
       WHERE e.entry_date BETWEEN ? AND ?
       ORDER BY e.entry_date ASC, e.created_at ASC`,
      [startDate, endDate]
    );

    res.json({
      tasks,
      payments,
      entries
    });
  } catch (err) {
    console.error('Get calendar events error:', err);
    res.status(500).json({ error: 'Failed to fetch calendar events' });
  }
};
