const db = require('../config/db');

exports.getDashboardSummary = async (req, res) => {
  const { seasonId } = req.query;
  try {
    const sparams = seasonId ? [seasonId] : [];
    const swhere = seasonId ? ' WHERE season_id = ?' : '';

    // Core metrics
    const revenueRes = await db.get(`SELECT COALESCE(SUM(total_amount),0) as total FROM entries${swhere}`, sparams);
    const collectionsRes = await db.get(`SELECT COALESCE(SUM(amount),0) as total FROM payments${swhere}`, sparams);
    const customersCount = await db.get('SELECT COUNT(*) as count FROM customers WHERE status = ?', ['active']);
    const entriesCount = await db.get(`SELECT COUNT(*) as count FROM entries${swhere}`, sparams);

    const revenue = revenueRes.total || 0;
    const collections = collectionsRes.total || 0;
    const outstanding = revenue - collections;

    // Active Season
    const activeSeason = await db.get("SELECT * FROM seasons WHERE status = 'Active' ORDER BY created_at DESC LIMIT 1");

    // Today metrics
    const today = new Date().toISOString().split('T')[0];
    const todayRevenue = await db.get(
      `SELECT COALESCE(SUM(total_amount),0) as total FROM entries WHERE entry_date = ?${seasonId ? ' AND season_id = ?' : ''}`,
      seasonId ? [today, seasonId] : [today]
    );
    const todayCollections = await db.get(
      `SELECT COALESCE(SUM(amount),0) as total FROM payments WHERE payment_date = ?${seasonId ? ' AND season_id = ?' : ''}`,
      seasonId ? [today, seasonId] : [today]
    );

    // Entry type breakdown
    const breakdown = await db.query(
      `SELECT entry_type, COALESCE(SUM(total_amount),0) as total, COUNT(*) as count FROM entries${swhere} GROUP BY entry_type`,
      sparams
    );

    // Collections trend (last 14 days)
    const collectionsTrend = await db.query(
      `SELECT payment_date as label, COALESCE(SUM(amount),0) as value FROM payments${swhere} GROUP BY payment_date ORDER BY payment_date DESC LIMIT 14`,
      sparams
    );

    // Revenue trend (last 14 days)
    const revenueTrend = await db.query(
      `SELECT entry_date as label, COALESCE(SUM(total_amount),0) as value FROM entries${swhere} GROUP BY entry_date ORDER BY entry_date DESC LIMIT 14`,
      sparams
    );

    // Top customers by outstanding
    const topCustomersRaw = await db.query(
      `SELECT * FROM (
        SELECT c.id, c.name, c.phone, c.village, c.status,
          (SELECT COALESCE(SUM(total_amount),0) FROM entries WHERE customer_id = c.id${seasonId ? ' AND season_id = ?' : ''}) as revenue,
          (SELECT COALESCE(SUM(amount),0) FROM payments WHERE customer_id = c.id${seasonId ? ' AND season_id = ?' : ''}) as paid
        FROM customers c
      ) sub WHERE sub.status = 'active'
      ORDER BY (sub.revenue - sub.paid) DESC LIMIT 5`,
      seasonId ? [seasonId, seasonId] : []
    );
    const topOutstandingCustomers = topCustomersRaw.map(tc => ({
      ...tc,
      outstanding: (tc.revenue || 0) - (tc.paid || 0)
    }));

    // Recent activity (latest 8 audit log entries)
    const recentActivity = await db.query(
      `SELECT a.*, u.full_name as user_name, u.role as user_role FROM audit_logs a LEFT JOIN users u ON a.user_id = u.id ORDER BY a.created_at DESC LIMIT 8`
    );

    res.json({
      metrics: {
        totalRevenue: revenue,
        totalCollections: collections,
        outstandingBalance: outstanding,
        customersCount: customersCount.count || 0,
        entriesCount: entriesCount.count || 0,
      },
      today: {
        revenue: todayRevenue.total || 0,
        collections: todayCollections.total || 0,
      },
      activeSeason,
      breakdown,
      collectionsTrend: collectionsTrend.reverse(),
      revenueTrend: revenueTrend.reverse(),
      topOutstandingCustomers,
      recentActivity,
    });
  } catch (err) {
    console.error('Dashboard error:', err);
    res.status(500).json({ error: 'Failed to aggregate dashboard analytics' });
  }
};

exports.getAuditLogs = async (req, res) => {
  try {
    if (!['Owner', 'Co-Owner', 'Manager'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Unauthorized: Management roles only' });
    }
    const logs = await db.query(
      `SELECT a.*, u.full_name as user_name, u.role as user_role 
       FROM audit_logs a LEFT JOIN users u ON a.user_id = u.id 
       ORDER BY a.created_at DESC LIMIT 200`
    );
    res.json(logs);
  } catch (err) {
    console.error('Audit logs error:', err);
    res.status(500).json({ error: 'Failed to retrieve audit logs' });
  }
};

exports.getAnalytics = async (req, res) => {
  const { seasonId } = req.query;
  const sparams = seasonId ? [seasonId] : [];
  const swhere = seasonId ? ' WHERE season_id = ?' : '';
  try {
    // Revenue by month
    const revenueByMonth = await db.query(
      `SELECT strftime('%Y-%m', entry_date) as month, COALESCE(SUM(total_amount),0) as value
       FROM entries${swhere} GROUP BY month ORDER BY month ASC`,
      sparams
    );

    // Collections by month
    const collectionsByMonth = await db.query(
      `SELECT strftime('%Y-%m', payment_date) as month, COALESCE(SUM(amount),0) as value
       FROM payments${swhere} GROUP BY month ORDER BY month ASC`,
      sparams
    );

    // By entry type
    const byType = await db.query(
      `SELECT entry_type as name, COALESCE(SUM(total_amount),0) as value
       FROM entries${swhere} GROUP BY entry_type`,
      sparams
    );

    // Top 10 customers by revenue
    const topCustomers = await db.query(
      `SELECT name, revenue, paid FROM (
         SELECT c.name,
           (SELECT COALESCE(SUM(total_amount),0) FROM entries WHERE customer_id = c.id${seasonId ? ' AND season_id = ?' : ''}) as revenue,
           (SELECT COALESCE(SUM(amount),0) FROM payments WHERE customer_id = c.id${seasonId ? ' AND season_id = ?' : ''}) as paid
         FROM customers c
       ) sub
       ORDER BY sub.revenue DESC LIMIT 10`,
      seasonId ? [seasonId, seasonId] : []
    );

    // Season comparison
    const seasonStats = await db.query(
      `SELECT s.name, s.status,
         COALESCE((SELECT SUM(total_amount) FROM entries WHERE season_id = s.id),0) as revenue,
         COALESCE((SELECT SUM(amount) FROM payments WHERE season_id = s.id),0) as paid
       FROM seasons s ORDER BY s.created_at DESC`
    );

    res.json({ revenueByMonth, collectionsByMonth, byType, topCustomers, seasonStats });
  } catch (err) {
    console.error('Analytics error:', err);
    res.status(500).json({ error: 'Failed to generate analytics' });
  }
};
