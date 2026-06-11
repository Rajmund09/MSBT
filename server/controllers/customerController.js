const db = require('../config/db');

// Helper to generate a random ID
const genId = (prefix = 'id') => `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

exports.createCustomer = async (req, res) => {
  const { name, phone, village, address, notes } = req.body;
  if (!name || !phone || !village) {
    return res.status(400).json({ error: 'Name, phone and village are required' });
  }

  const id = genId('cust');
  try {
    await db.run(
      'INSERT INTO customers (id, name, phone, village, address, notes, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [id, name, phone, village, address || '', notes || '', 'active']
    );

    // Audit log
    await db.run(
      'INSERT INTO audit_logs (id, user_id, action, target_table, target_id, details, ip_address) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [genId('audit'), req.user.id, 'CREATE_CUSTOMER', 'customers', id, `Created customer ${name}`, req.ip]
    );

    res.status(201).json({ id, name, phone, village, address, notes, status: 'active' });
  } catch (err) {
    console.error('Create customer error:', err);
    res.status(500).json({ error: 'Failed to create customer record' });
  }
};

exports.getAllCustomers = async (req, res) => {
  const { seasonId } = req.query;
  try {
    let customers;
    if (seasonId) {
      customers = await db.query(
        `SELECT * FROM customers WHERE id IN (
          SELECT customer_id FROM entries WHERE season_id = ?
          UNION
          SELECT customer_id FROM payments WHERE season_id = ?
        ) ORDER BY name ASC`,
        [seasonId, seasonId]
      );
    } else {
      customers = await db.query('SELECT * FROM customers ORDER BY name ASC');
    }
    
    const detailedCustomers = await Promise.all(customers.map(async (c) => {
      let entrySum, paymentSum, hoursSum, tripsSum;
      if (seasonId) {
        entrySum = await db.get('SELECT SUM(total_amount) as total FROM entries WHERE customer_id = ? AND season_id = ?', [c.id, seasonId]);
        paymentSum = await db.get('SELECT SUM(amount) as total FROM payments WHERE customer_id = ? AND season_id = ?', [c.id, seasonId]);
        hoursSum = await db.get("SELECT SUM(quantity) as total FROM entries WHERE customer_id = ? AND season_id = ? AND entry_type = 'Hour'", [c.id, seasonId]);
        tripsSum = await db.get("SELECT SUM(quantity) as total FROM entries WHERE customer_id = ? AND season_id = ? AND entry_type = 'Trip'", [c.id, seasonId]);
      } else {
        entrySum = await db.get('SELECT SUM(total_amount) as total FROM entries WHERE customer_id = ?', [c.id]);
        paymentSum = await db.get('SELECT SUM(amount) as total FROM payments WHERE customer_id = ?', [c.id]);
        hoursSum = await db.get("SELECT SUM(quantity) as total FROM entries WHERE customer_id = ? AND entry_type = 'Hour'", [c.id]);
        tripsSum = await db.get("SELECT SUM(quantity) as total FROM entries WHERE customer_id = ? AND entry_type = 'Trip'", [c.id]);
      }
      
      const totalRevenue = entrySum.total || 0;
      const totalPaid = paymentSum.total || 0;
      const outstanding = totalRevenue - totalPaid;

      const totalHours = hoursSum?.total || 0;
      const totalTrips = tripsSum?.total || 0;
      
      let facilityDetails = [];
      if (totalHours > 0) facilityDetails.push(`${totalHours} Hour(s)`);
      if (totalTrips > 0) facilityDetails.push(`${totalTrips} Trip(s)`);
      const facilityDetailsStr = facilityDetails.length > 0 ? facilityDetails.join(' | ') : 'None';

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
        lastEditedBy
      };
    }));

    // If a season is selected, we might only want to return customers active in that season,
    // but typically we can return all customers and just their season stats,
    // let's return all customers.
    res.json(detailedCustomers);
  } catch (err) {
    console.error('Get all customers error:', err);
    res.status(500).json({ error: 'Failed to fetch customer index' });
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
    const totalRevenue = entries.reduce((acc, curr) => acc + curr.total_amount, 0);
    const totalPaid = payments.reduce((acc, curr) => acc + curr.amount, 0);
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
    console.error('Get customer details error:', err);
    res.status(500).json({ error: 'Failed to retrieve customer ledger profiles' });
  }
};

exports.updateCustomer = async (req, res) => {
  const { id } = req.params;
  const { name, phone, village, address, notes, status } = req.body;

  if (!name || !phone || !village) {
    return res.status(400).json({ error: 'Name, phone and village are required' });
  }

  try {
    const existing = await db.get('SELECT * FROM customers WHERE id = ?', [id]);
    if (!existing) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    await db.run(
      'UPDATE customers SET name = ?, phone = ?, village = ?, address = ?, notes = ?, status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [name, phone, village, address || '', notes || '', status || 'active', id]
    );

    // Audit log
    await db.run(
      'INSERT INTO audit_logs (id, user_id, action, target_table, target_id, details, ip_address) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [genId('audit'), req.user.id, 'UPDATE_CUSTOMER', 'customers', id, `Updated customer ${name}`, req.ip]
    );

    res.json({ id, name, phone, village, address, notes, status });
  } catch (err) {
    console.error('Update customer error:', err);
    res.status(500).json({ error: 'Failed to update customer details' });
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
    console.error('Delete customer error:', err);
    res.status(500).json({ error: 'Failed to permanently delete customer' });
  }
};
