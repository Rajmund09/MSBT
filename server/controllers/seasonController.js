const db = require('../config/db');

const genId = (prefix = 'id') => `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

exports.createSeason = async (req, res) => {
  const { name, startDate, endDate } = req.body;
  if (!name || !startDate) {
    return res.status(400).json({ error: 'Season name and start date are required' });
  }

  const id = genId('season');
  try {
    // Check if there are other Active seasons. If there is, we don't automatically close them, 
    // but the system will allow multiple active seasons or we warn them. We will set status to 'Active'.
    await db.run(
      'INSERT INTO seasons (id, name, start_date, end_date, status, created_by) VALUES (?, ?, ?, ?, ?, ?)',
      [id, name, startDate, endDate || null, 'Active', req.user.id]
    );

    // Audit log
    await db.run(
      'INSERT INTO audit_logs (id, user_id, action, target_table, target_id, details, ip_address) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [genId('audit'), req.user.id, 'CREATE_SEASON', 'seasons', id, `Created season: ${name}`, req.ip]
    );

    res.status(201).json({ id, name, startDate, endDate, status: 'Active' });
  } catch (err) {
    console.error('Create season error:', err);
    res.status(500).json({ error: 'Failed to create season' });
  }
};

exports.getAllSeasons = async (req, res) => {
  try {
    const seasons = await db.query('SELECT * FROM seasons ORDER BY created_at DESC');
    
    // Supplement each season with basic metrics (revenue and collections within that season)
    const detailedSeasons = await Promise.all(seasons.map(async (s) => {
      const entrySum = await db.get('SELECT SUM(total_amount) as total FROM entries WHERE season_id = ?', [s.id]);
      const paymentSum = await db.get('SELECT SUM(amount) as total FROM payments WHERE season_id = ?', [s.id]);
      
      return {
        ...s,
        revenue: entrySum.total || 0,
        payments: paymentSum.total || 0,
        outstanding: (entrySum.total || 0) - (paymentSum.total || 0)
      };
    }));

    res.json(detailedSeasons);
  } catch (err) {
    console.error('Get seasons error:', err);
    res.status(500).json({ error: 'Failed to fetch seasons' });
  }
};

exports.updateSeasonStatus = async (req, res) => {
  const { id } = req.params;
  const { status, endDate } = req.body; // Status can be 'Active', 'Closed', 'Archived'

  if (!status) {
    return res.status(400).json({ error: 'Status is required' });
  }

  try {
    const existing = await db.get('SELECT * FROM seasons WHERE id = ?', [id]);
    if (!existing) {
      return res.status(404).json({ error: 'Season not found' });
    }

    const finalEndDate = endDate || (status === 'Closed' ? new Date().toISOString().split('T')[0] : existing.end_date);

    await db.run(
      'UPDATE seasons SET status = ?, end_date = ? WHERE id = ?',
      [status, finalEndDate, id]
    );

    // Audit log
    await db.run(
      'INSERT INTO audit_logs (id, user_id, action, target_table, target_id, details, ip_address) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [genId('audit'), req.user.id, 'UPDATE_SEASON_STATUS', 'seasons', id, `Updated season status of '${existing.name}' to ${status}`, req.ip]
    );

    res.json({ id, name: existing.name, status, endDate: finalEndDate });
  } catch (err) {
    console.error('Update season status error:', err);
    res.status(500).json({ error: 'Failed to update season status' });
  }
};
