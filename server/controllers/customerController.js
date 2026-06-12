const db = require('../config/db');
const { handleControllerError } = require('../utils/errorHandler');

// Helper to generate a random ID
const genId = (prefix = 'id') => `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

exports.createCustomer = async (req, res) => {
  const { name, phone, village, address, notes } = req.body;
  if (!name || !village) {
    return res.status(400).json({ error: 'Name and village are required' });
  }

  const id = genId('cust');
  try {
    await db.run(
      'INSERT INTO customers (id, name, phone, village, address, notes, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [id, name, phone || '', village, address || '', notes || '', 'active']
    );

    // Audit log
    await db.run(
      'INSERT INTO audit_logs (id, user_id, action, target_table, target_id, details, ip_address) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [genId('audit'), req.user.id, 'CREATE_CUSTOMER', 'customers', id, `Created customer ${name}`, req.ip]
    );

    res.status(201).json({ id, name, phone, village, address, notes, status: 'active' });
  } catch (err) {
    handleControllerError(req, res, err, 'Create customer record');
  }
};

exports.getAllCustomers = async (req, res) => {
  const { seasonId } = req.query;
  try {
    let customers = await db.query('SELECT * FROM customers ORDER BY name ASC');

    
    const detailedCustomers = await Promise.all(customers.map(async (c) => {
      let entrySum, paymentSum, tripsSum, minutesSum, hoursSum, tradesSum;
      if (seasonId) {
        entrySum = await db.get('SELECT SUM(total_amount) as total FROM entries WHERE customer_id = ? AND season_id = ?', [c.id, seasonId]);
        paymentSum = await db.get('SELECT SUM(amount) as total FROM payments WHERE customer_id = ? AND season_id = ?', [c.id, seasonId]);
        tripsSum = await db.get("SELECT SUM(quantity) as total FROM entries WHERE customer_id = ? AND season_id = ? AND entry_type = 'Trip'", [c.id, seasonId]);
        minutesSum = await db.get("SELECT SUM(quantity) as total FROM entries WHERE customer_id = ? AND season_id = ? AND entry_type = 'Minute'", [c.id, seasonId]);
        hoursSum = await db.get("SELECT SUM(quantity) as total FROM entries WHERE customer_id = ? AND season_id = ? AND entry_type = 'Hour'", [c.id, seasonId]);
        tradesSum = await db.get("SELECT SUM(quantity) as total FROM entries WHERE customer_id = ? AND season_id = ? AND entry_type = 'Trade'", [c.id, seasonId]);
      } else {
        entrySum = await db.get('SELECT SUM(total_amount) as total FROM entries WHERE customer_id = ?', [c.id]);
        paymentSum = await db.get('SELECT SUM(amount) as total FROM payments WHERE customer_id = ?', [c.id]);
        tripsSum = await db.get("SELECT SUM(quantity) as total FROM entries WHERE customer_id = ? AND entry_type = 'Trip'", [c.id]);
        minutesSum = await db.get("SELECT SUM(quantity) as total FROM entries WHERE customer_id = ? AND entry_type = 'Minute'", [c.id]);
        hoursSum = await db.get("SELECT SUM(quantity) as total FROM entries WHERE customer_id = ? AND entry_type = 'Hour'", [c.id]);
        tradesSum = await db.get("SELECT SUM(quantity) as total FROM entries WHERE customer_id = ? AND entry_type = 'Trade'", [c.id]);
      }
      
      const totalRevenue = Number(entrySum?.total) || 0;
      const totalPaid = Number(paymentSum?.total) || 0;
      const outstanding = totalRevenue - totalPaid;

      const qTrips = Number(tripsSum?.total) || 0;
      const qMinutes = Number(minutesSum?.total) || 0;
      const qHours = Number(hoursSum?.total) || 0;
      const qTrades = Number(tradesSum?.total) || 0;

      const totalTrips = qTrips;
      const totalMinutes = qMinutes + (qHours * 60);
      const totalTrades = qTrades;
      
      let facilityDetails = [];
      if (totalTrips > 0) facilityDetails.push(`${totalTrips} Trip(s)`);
      if (totalMinutes > 0) facilityDetails.push(`${totalMinutes} Minute(s)`);
      if (totalTrades > 0) facilityDetails.push(`${totalTrades} Trade(s)`);
      const facilityDetailsStr = facilityDetails.length > 0 ? facilityDetails.join(' | ') : 'None';

      const customerSeasons = await db.query(`
        SELECT DISTINCT s.name 
        FROM (
          SELECT season_id FROM entries WHERE customer_id = ?
          UNION
          SELECT season_id FROM payments WHERE customer_id = ?
        ) ep
        JOIN seasons s ON ep.season_id = s.id
      `, [c.id, c.id]);
      const customerSeasonNames = customerSeasons.map(s => s.name).join(', ') || 'None';

      const lastEdit = await db.get(`
        SELECT u.full_name, u.role 
        FROM audit_logs a 
        JOIN users u ON a.user_id = u.id 
        WHERE a.target_id = ? AND a.target_table = 'customers' 
        ORDER BY a.created_at DESC LIMIT 1
      `, [c.id]);
      const lastEditedBy = lastEdit ? `${lastEdit.full_name} (${lastEdit.role})` : 'System';
      
      return {
        ...c,
        totalRevenue,
        totalPaid,
        outstanding,
        facilityDetails: facilityDetailsStr,
        lastEditedBy,
        seasonName: customerSeasonNames,
        totalTrips,
        totalMinutes,
        totalTrades
      };
    }));

    // If a season is selected, we might only want to return customers active in that season,
    // but typically we can return all customers and just their season stats,
    // let's return all customers.
    res.json(detailedCustomers);
  } catch (err) {
    handleControllerError(req, res, err, 'Fetch customer index');
  }
};

exports.getCustomerById = async (req, res) => {
  const { id } = req.params;
  try {
    const customer = await db.get('SELECT * FROM customers WHERE id = ?', [id]);
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    // Load ledger history
    const entries = await db.query(
      'SELECT e.*, s.name as season_name FROM entries e LEFT JOIN seasons s ON e.season_id = s.id WHERE e.customer_id = ? ORDER BY e.entry_date DESC, e.created_at DESC', 
      [id]
    );
    const payments = await db.query(
      'SELECT p.*, s.name as season_name FROM payments p LEFT JOIN seasons s ON p.season_id = s.id WHERE p.customer_id = ? ORDER BY p.payment_date DESC, p.created_at DESC', 
      [id]
    );

    // Merge and sort ledger events chronologically
    const ledger = [];
    entries.forEach(e => {
      ledger.push({
        id: e.id,
        date: e.entry_date,
        type: 'debit', // Entry adds to balance
        entryType: e.entry_type,
        description: `${e.entry_type} Entry: ${e.quantity} @ ${e.rate} (${e.description || 'No description'})`,
        amount: e.total_amount,
        seasonName: e.season_name,
        createdAt: e.created_at
      });
    });

    payments.forEach(p => {
      ledger.push({
        id: p.id,
        date: p.payment_date,
        type: 'credit', // Payment reduces balance
        entryType: 'Payment',
        description: `Payment via ${p.payment_mode}${p.reference_no ? ' (Ref: ' + p.reference_no + ')' : ''} - ${p.notes || 'No notes'}`,
        amount: p.amount,
        seasonName: p.season_name,
        createdAt: p.created_at
      });
    });

    // Sort ledger by date desc, then createdAt desc
    ledger.sort((a, b) => {
      const dateDiff = new Date(b.date) - new Date(a.date);
      if (dateDiff !== 0) return dateDiff;
      return new Date(b.createdAt) - new Date(a.createdAt);
    });

    // Summary calculations
    const totalRevenue = entries.reduce((acc, curr) => acc + (Number(curr.total_amount) || 0), 0);
    const totalPaid = payments.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
    const outstanding = totalRevenue - totalPaid;

    res.json({
      customer,
      summary: {
        totalRevenue,
        totalPaid,
        outstanding
      },
      ledger
    });

  } catch (err) {
    handleControllerError(req, res, err, 'Retrieve customer ledger profiles');
  }
};

exports.updateCustomer = async (req, res) => {
  const { id } = req.params;
  const { name, phone, village, address, notes, status } = req.body;

  if (!name || !village) {
    return res.status(400).json({ error: 'Name and village are required' });
  }

  try {
    const existing = await db.get('SELECT * FROM customers WHERE id = ?', [id]);
    if (!existing) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    await db.run(
      'UPDATE customers SET name = ?, phone = ?, village = ?, address = ?, notes = ?, status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [name, phone || '', village, address || '', notes || '', status || 'active', id]
    );

    // Audit log
    await db.run(
      'INSERT INTO audit_logs (id, user_id, action, target_table, target_id, details, ip_address) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [genId('audit'), req.user.id, 'UPDATE_CUSTOMER', 'customers', id, `Updated customer ${name}`, req.ip]
    );

    res.json({ id, name, phone, village, address, notes, status });
  } catch (err) {
    handleControllerError(req, res, err, 'Update customer details');
  }
};

exports.deleteCustomer = async (req, res) => {
  const { id } = req.params;

  try {
    const existing = await db.get('SELECT * FROM customers WHERE id = ?', [id]);
    if (!existing) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    // Permanently delete all related records
    await db.run('DELETE FROM entries WHERE customer_id = ?', [id]);
    await db.run('DELETE FROM payments WHERE customer_id = ?', [id]);
    await db.run('DELETE FROM customers WHERE id = ?', [id]);

    // Audit log
    await db.run(
      'INSERT INTO audit_logs (id, user_id, action, target_table, target_id, details, ip_address) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [genId('audit'), req.user.id, 'DELETE_CUSTOMER', 'customers', id, `Permanently deleted customer ${existing.name} and all related ledger records`, req.ip]
    );

    res.json({ success: true, message: 'Customer permanently deleted' });
  } catch (err) {
    handleControllerError(req, res, err, 'Permanently delete customer');
  }
};
