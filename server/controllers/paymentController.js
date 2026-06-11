const db = require('../config/db');
const { handleControllerError } = require('../utils/errorHandler');

const genId = (prefix = 'id') => `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

exports.createPayment = async (req, res) => {
  const { customerId, seasonId, amount, paymentMode, referenceNo, paymentDate, notes } = req.body;

  if (!customerId || !seasonId || !amount || !paymentMode || !paymentDate) {
    return res.status(400).json({ error: 'Customer, Season, Amount, Payment Mode and Date are required' });
  }

  const numericAmount = parseFloat(amount);
  if (numericAmount <= 0) {
    return res.status(400).json({ error: 'Amount must be greater than zero' });
  }

  const id = genId('pay');
  try {
    // Check if season is active or archived
    const season = await db.get('SELECT * FROM seasons WHERE id = ?', [seasonId]);
    if (!season) {
      return res.status(404).json({ error: 'Season not found' });
    }
    if (season.status === 'Archived') {
      return res.status(400).json({ error: 'Cannot log payments in an Archived season' });
    }

    await db.run(
      'INSERT INTO payments (id, customer_id, season_id, amount, payment_mode, reference_no, payment_date, notes, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [id, customerId, seasonId, numericAmount, paymentMode, referenceNo || null, paymentDate, notes || '', req.user.id]
    );

    // Audit Log
    const customer = await db.get('SELECT name FROM customers WHERE id = ?', [customerId]);
    await db.run(
      'INSERT INTO audit_logs (id, user_id, action, target_table, target_id, details, ip_address) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [
        genId('audit'),
        req.user.id,
        'CREATE_PAYMENT',
        'payments',
        id,
        `Recorded payment of INR ${numericAmount} via ${paymentMode} from customer ${customer ? customer.name : customerId}`,
        req.ip
      ]
    );

    res.status(201).json({
      id,
      customerId,
      seasonId,
      amount: numericAmount,
      paymentMode,
      referenceNo,
      paymentDate,
      notes,
      createdBy: req.user.id
    });
  } catch (err) {
    handleControllerError(req, res, err, 'Record payment transaction');
  }
};

exports.getAllPayments = async (req, res) => {
  const { customerId, seasonId } = req.query;
  try {
    let query = 'SELECT p.*, c.name as customer_name, c.village as customer_village, s.name as season_name FROM payments p JOIN customers c ON p.customer_id = c.id JOIN seasons s ON p.season_id = s.id';
    const params = [];

    if (customerId && seasonId) {
      query += ' WHERE p.customer_id = ? AND p.season_id = ?';
      params.push(customerId, seasonId);
    } else if (customerId) {
      query += ' WHERE p.customer_id = ?';
      params.push(customerId);
    } else if (seasonId) {
      query += ' WHERE p.season_id = ?';
      params.push(seasonId);
    }

    query += ' ORDER BY p.payment_date DESC, p.created_at DESC';

    const payments = await db.query(query, params);
    res.json(payments);
  } catch (err) {
    handleControllerError(req, res, err, 'Fetch payments ledger');
  }
};

exports.deletePayment = async (req, res) => {
  const { id } = req.params;

  // Security Check: Deletion of payments is critical. Restricted to Owner / Co-Owner / Manager.
  if (!['Owner', 'Co-Owner', 'Manager'].includes(req.user.role)) {
    return res.status(403).json({ error: 'Unauthorized: Only Managers and Owners can delete payments.' });
  }

  try {
    const payment = await db.get('SELECT p.*, c.name as customer_name FROM payments p JOIN customers c ON p.customer_id = c.id WHERE p.id = ?', [id]);
    if (!payment) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    await db.run('DELETE FROM payments WHERE id = ?', [id]);

    // Audit Log
    await db.run(
      'INSERT INTO audit_logs (id, user_id, action, target_table, target_id, details, ip_address) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [
        genId('audit'),
        req.user.id,
        'DELETE_PAYMENT',
        'payments',
        id,
        `Deleted payment of INR ${payment.amount} via ${payment.payment_mode} from customer ${payment.customer_name}`,
        req.ip
      ]
    );

    res.json({ message: 'Payment successfully deleted', id });
  } catch (err) {
    handleControllerError(req, res, err, 'Delete payment transaction');
  }
};
