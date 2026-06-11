const fs = require('fs');
const path = require('path');
const db = require('./config/db');

(async () => {
  console.log('🔄 Initializing Database Reset...');
  try {
    // 1. Initialize the DB Connection
    await db.initialize();
    
    if (db.type === 'postgres') {
      console.log('🐘 PostgreSQL detected. Clearing tables and running migration DDL...');
      
      // We obtain direct pool instance to run raw commands
      const { Pool } = require('pg');
      const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
      });
      
      // Drop all tables in dependency order with CASCADE
      console.log('🧹 Dropping existing tables...');
      await pool.query(`
        DROP TABLE IF EXISTS tasks CASCADE;
        DROP TABLE IF EXISTS audit_logs CASCADE;
        DROP TABLE IF EXISTS invoices CASCADE;
        DROP TABLE IF EXISTS payments CASCADE;
        DROP TABLE IF EXISTS entries CASCADE;
        DROP TABLE IF EXISTS customers CASCADE;
        DROP TABLE IF EXISTS seasons CASCADE;
        DROP TABLE IF EXISTS users CASCADE;
      `);
      console.log('✅ Tables dropped successfully.');

      // Load and run the PostgreSQL schema migrations
      console.log('🏗️ Applying schema DDL...');
      const schemaPath = path.join(__dirname, '../database/schema.sql');
      const schemaSQL = fs.readFileSync(schemaPath, 'utf8');
      await pool.query(schemaSQL);
      console.log('✅ Production PostgreSQL Schema applied successfully.');

      // Load and run the seed script
      console.log('🌱 Inserting default admin and user seed data...');
      const seedPath = path.join(__dirname, '../database/seed.sql');
      const seedSQL = fs.readFileSync(seedPath, 'utf8');
      await pool.query(seedSQL);
      console.log('✅ Default users seeded successfully.');

      await pool.end();
    } else if (db.type === 'sqlite') {
      console.log('📁 SQLite detected. Resetting local database tables...');
      
      await new Promise((resolve, reject) => {
        const sqlite3 = require('sqlite3').verbose();
        const SQLite_DB_PATH = process.env.SQLITE_DB_PATH || path.join(__dirname, '../database/msbt.db');
        const tempDb = new sqlite3.Database(SQLite_DB_PATH, (err) => {
          if (err) return reject(err);
          tempDb.serialize(() => {
            tempDb.run('DROP TABLE IF EXISTS tasks;');
            tempDb.run('DROP TABLE IF EXISTS audit_logs;');
            tempDb.run('DROP TABLE IF EXISTS invoices;');
            tempDb.run('DROP TABLE IF EXISTS payments;');
            tempDb.run('DROP TABLE IF EXISTS entries;');
            tempDb.run('DROP TABLE IF EXISTS customers;');
            tempDb.run('DROP TABLE IF EXISTS seasons;');
            tempDb.run('DROP TABLE IF EXISTS users;', (err) => {
              if (err) return reject(err);
              tempDb.close((closeErr) => {
                if (closeErr) reject(closeErr);
                else resolve();
              });
            });
          });
        });
      });
      console.log('✅ SQLite Tables dropped successfully.');
      
      // Re-initialize sqlite DB which will trigger sqlite_schema.sql and seed.sql creation automatically
      console.log('🏗️ Re-initializing database...');
      await db.initialize();
      console.log('✅ SQLite database reset and seeded successfully.');
    }
    
    console.log('🎉 Database has been successfully cleared and initialized fresh!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Database reset failed:', err);
    process.exit(1);
  }
})();
