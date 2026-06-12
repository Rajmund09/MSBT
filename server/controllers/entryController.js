const db = require('../config/db');
const { handleControllerError } = require('../utils/errorHandler');

const genId = (prefix = 'id') => `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

exports.createEntry = async (req, res) => {
  const { customerId, seasonId, entryType, rate, quantity, description, entryDate } = req.body;

  if (!customerId || !seasonId || !entryType || rate === undefined || !quantity || !entryDate) {
    return res.status(400).json({ error: 'Customer, Season, Type, Rate, Quantity and Date are required' });
  }

  if (!['Trip', 'Hour', 'Trade', 'Minute'].includes(entryType)) {
    return res.status(400).json({ error: 'Invalid entry type. Must be Trip, Hour, Trade, or Minute' });
  }

  const id = genId('entry');
  const numericRate = parseFloat(rate);
  const numericQuantity = parseFloat(quantity);
  let totalAmount = numericRate * numericQuantity;
  if (entryType === 'Hour') {
    totalAmount = numericRate * numericQuantity * 60;
  }

  try {
    // Check if season is active or closed
    const season = await db.get('SELECT * FROM seasons WHERE id = ?', [seasonId]);
    if (!season) {
      return res.status(404).json({ error: 'Season not found' });
    }
    if (season.status === 'Archived') {
      return res.status(400).json({ error: 'Cannot log entries into an Archived season' });
    }

    // Insert entry. Since SQLite has standard column, we specify total_amount explicitly.
    // For PostgreSQL, the column is GENERATED, but if we write an adapter wrapper we can adjust.
    // To make it fully database-independent:
    if (db.type === 'sqlite') {
      await db.run(
        'INSERT INTO entries (id, customer_id, season_id, entry_type, rate, quantity, total_amount, description, entry_date, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [id, customerId, seasonId, entryType, numericRate, numericQuantity, totalAmount, description || '', entryDate, req.user.id]
      );
    } else {
      // Postgres automatically calculates total_amount, so we omit total_amount in INSERT query
      await db.run(
        'INSERT INTO entries (id, customer_id, season_id, entry_type, rate, quantity, description, entry_date, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [id, customerId, seasonId, entryType, numericRate, numericQuantity, description || '', entryDate, req.user.id]
      );
    }

    // Audit Log
    const customer = await db.get('SELECT name FROM customers WHERE id = ?', [customerId]);
    await db.run(
      'INSERT INTO audit_logs (id, user_id, action, target_table, target_id, details, ip_address) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [
        genId('audit'),
        req.user.id,
        'CREATE_ENTRY',
        'entries',
        id,
        `Created ${entryType} entry for customer ${customer ? customer.name : customerId}: ${numericQuantity} @ ${numericRate} = INR ${totalAmount}`,
        req.ip
      ]
    );

    res.status(201).json({
      id,
      customerId,
      seasonId,
      entryType,
      rate: numericRate,
      quantity: numericQuantity,
      totalAmount,
      description,
      entryDate,
      createdBy: req.user.id
    });

  } catch (err) {
    handleControllerError(req, res, err, 'Record entry log');
  }
};

exports.getAllEntries = async (req, res) => {
  const { customerId, seasonId } = req.query;
  try {
    let query = 'SELECT e.*, c.name as customer_name, c.village as customer_village, s.name as season_name FROM entries e JOIN customers c ON e.customer_id = c.id JOIN seasons s ON e.season_id = s.id';
    const params = [];

    if (customerId && seasonId) {
      query += ' WHERE e.customer_id = ? AND e.season_id = ?';
      params.push(customerId, seasonId);
    } else if (customerId) {
      query += ' WHERE e.customer_id = ?';
      params.push(customerId);
    } else if (seasonId) {
      query += ' WHERE e.season_id = ?';
      params.push(seasonId);
    }

    query += ' ORDER BY e.entry_date DESC, e.created_at DESC';

    const entries = await db.query(query, params);
    res.json(entries);
  } catch (err) {
    handleControllerError(req, res, err, 'Fetch entries log');
  }
};

exports.deleteEntry = async (req, res) => {
  const { id } = req.params;
  
  // Security Check: Only Owner, Co-Owner or Manager can delete entries.
  if (!['Owner', 'Co-Owner', 'Manager'].includes(req.user.role)) {
    return res.status(403).json({ error: 'Unauthorized: Only Managers and Owners can delete records.' });
  }

  try {
    const entry = await db.get('SELECT e.*, c.name as customer_name FROM entries e JOIN customers c ON e.customer_id = c.id WHERE e.id = ?', [id]);
    if (!entry) {
      return res.status(404).json({ error: 'Entry not found' });
    }

    await db.run('DELETE FROM entries WHERE id = ?', [id]);

    // Audit Log
    await db.run(
      'INSERT INTO audit_logs (id, user_id, action, target_table, target_id, details, ip_address) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [
        genId('audit'),
        req.user.id,
        'DELETE_ENTRY',
        'entries',
        id,
        `Deleted ${entry.entry_type} entry for customer ${entry.customer_name}: ${entry.quantity} @ ${entry.rate} = INR ${entry.total_amount}`,
        req.ip
      ]
    );

    res.json({ message: 'Entry successfully deleted', id });
  } catch (err) {
    handleControllerError(req, res, err, 'Delete entry log');
  }
};

exports.updateEntry = async (req, res) => {
  const { id } = req.params;
  const { seasonId, entryType, rate, quantity, description, entryDate } = req.body;

  if (!seasonId || !entryType || rate === undefined || !quantity || !entryDate) {
    return res.status(400).json({ error: 'Season, Type, Rate, Quantity and Date are required' });
  }

  if (!['Trip', 'Hour', 'Trade', 'Minute'].includes(entryType)) {
    return res.status(400).json({ error: 'Invalid entry type. Must be Trip, Hour, Trade, or Minute' });
  }

  const numericRate = parseFloat(rate);
  const numericQuantity = parseFloat(quantity);
  let totalAmount = numericRate * numericQuantity;
  if (entryType === 'Hour') {
    totalAmount = numericRate * numericQuantity * 60;
  }

  try {
    const existing = await db.get('SELECT * FROM entries WHERE id = ?', [id]);
    if (!existing) {
      return res.status(404).json({ error: 'Entry not found' });
    }

    const season = await db.get('SELECT * FROM seasons WHERE id = ?', [seasonId]);
    if (!season) {
      return res.status(404).json({ error: 'Season not found' });
    }
    if (season.status === 'Archived') {
      return res.status(400).json({ error: 'Cannot log/update entries into an Archived season' });
    }

    await db.run(
      'UPDATE entries SET season_id = ?, entry_type = ?, rate = ?, quantity = ?, total_amount = ?, description = ?, entry_date = ? WHERE id = ?',
      [seasonId, entryType, numericRate, numericQuantity, totalAmount, description || '', entryDate, id]
    );

    // Audit Log
    const customer = await db.get('SELECT name FROM customers WHERE id = ?', [existing.customer_id]);
    await db.run(
      'INSERT INTO audit_logs (id, user_id, action, target_table, target_id, details, ip_address) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [
        genId('audit'),
        req.user.id,
        'UPDATE_ENTRY',
        'entries',
        id,
        `Updated ${entryType} entry for customer ${customer ? customer.name : existing.customer_id}: ${numericQuantity} @ ${numericRate} = INR ${totalAmount} (was ${existing.quantity} @ ${existing.rate} = INR ${existing.total_amount})`,
        req.ip
      ]
    );

    res.json({
      id,
      customerId: existing.customer_id,
      seasonId,
      entryType,
      rate: numericRate,
      quantity: numericQuantity,
      totalAmount,
      description,
      entryDate
    });
  } catch (err) {
    handleControllerError(req, res, err, 'Update entry log');
  }
};
