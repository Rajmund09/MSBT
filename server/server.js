const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const db = require('./config/db');

// Route Imports
const authRoutes = require('./routes/auth');
const customerRoutes = require('./routes/customers');
const seasonRoutes = require('./routes/seasons');
const entryRoutes = require('./routes/entries');
const paymentRoutes = require('./routes/payments');
const dashboardRoutes = require('./routes/dashboard');
const taskRoutes = require('./routes/tasks');

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS & JSON parsing
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Serving PWA Client build assets
app.use(express.static(path.join(__dirname, '../client/dist')));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/seasons', seasonRoutes);
app.use('/api/entries', entryRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/tasks', taskRoutes);

// Health Check API
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    system: 'MSBT Enterprise ERP',
    dbType: db.type,
    serverTime: new Date()
  });
});

// Serve frontend routing for SPA client (fallback for client routing)
app.get('*', (req, res) => {
  const filePath = path.join(__dirname, '../client/dist/index.html');
  if (fs.existsSync(filePath)) {
    res.sendFile(filePath);
  } else {
    res.json({
      status: 'online',
      system: 'MSBT Enterprise ERP API',
      message: 'MSBT Backend API is online. Client static assets are not packaged inside this instance.'
    });
  }
});

// Boot DB & Start Listening
if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
  db.initialize().then(() => {
    app.listen(PORT, () => {
      console.log(`================================================`);
      console.log(`🚀 MSBT Digital ERP is running on port ${PORT}`);
      console.log(`📂 DB Engine: ${db.type.toUpperCase()}`);
      console.log(`🔒 Security Mode: JWT + RBAC Enabled`);
      console.log(`================================================`);
    });
  }).catch(err => {
    console.error('❌ Failed to launch database adapter:', err);
    process.exit(1);
  });
} else {
  // In Vercel serverless environment, perform initialization immediately
  db.initialize().catch(err => {
    console.error('❌ Failed to launch database adapter in serverless:', err);
  });
}

module.exports = app;
