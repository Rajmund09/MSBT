const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const { Pool } = require('pg');

// Determine database type based on Environment Variables
// By default, fallback to 'sqlite' for zero-config developer onboarding
const DB_TYPE = process.env.DB_TYPE || 'sqlite'; 
const SQLite_DB_PATH = process.env.SQLITE_DB_PATH || path.join(__dirname, '../../database/msbt.db');

let dbInstance = null;

if (DB_TYPE === 'postgres') {
  console.log('PostgreSQL Selected. Instantiating connection pool...');
  dbInstance = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });
}

// Helper to translate SQLite query syntax (e.g. ? placeholders, strftime) to PostgreSQL compatibility
const translateQuery = (sql) => {
  if (DB_TYPE !== 'postgres') return sql;
  
  let counter = 1;
  // Replace ? with $1, $2, ...
  let translated = sql.replace(/\?/g, () => `$${counter++}`);
  // Replace SQLite strftime('%Y-%m', date) with PostgreSQL TO_CHAR(date, 'YYYY-MM')
  translated = translated.replace(/strftime\((['"]%Y-%m['"])\s*,\s*([^)]+)\)/gi, "TO_CHAR($2, 'YYYY-MM')");
  return translated;
};

const dbAdapter = {
  type: DB_TYPE,
  
  initialize: async () => {
    if (DB_TYPE === 'sqlite') {
      return new Promise((resolve, reject) => {
        // Ensure parent directory exists
        const dir = path.dirname(SQLite_DB_PATH);
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }

        // Create DB file if not exists
        dbInstance = new sqlite3.Database(SQLite_DB_PATH, async (err) => {
          if (err) {
            console.error('SQLite connection error:', err);
            return reject(err);
          }
          
          console.log(`Connected to local SQLite database at: ${SQLite_DB_PATH}`);
          
          try {
            // Check if tables already exist (e.g. users table)
            dbInstance.get("SELECT name FROM sqlite_master WHERE type='table' AND name='users'", async (err, row) => {
              if (err) return reject(err);
              
              if (!row) {
                console.log('Database empty. Running initial schema migrations...');
                const schemaPath = path.join(__dirname, '../../database/sqlite_schema.sql');
                const seedPath = path.join(__dirname, '../../database/seed.sql');
                
                const schemaSQL = fs.readFileSync(schemaPath, 'utf8');
                const seedSQL = fs.readFileSync(seedPath, 'utf8');
                
                // Execute schema creation
                dbInstance.exec(schemaSQL, (err) => {
                  if (err) {
                    console.error('Schema creation failed:', err);
                    return reject(err);
                  }
                  console.log('✅ SQLite Schema applied successfully.');
                  
                  // Execute seeds
                  dbInstance.exec(seedSQL, (err) => {
                    if (err) {
                      console.error('Database seeding failed:', err);
                      return reject(err);
                    }
                    console.log('✅ SQLite Seeds applied successfully.');
                    resolve();
                  });
                });
              } else {
                console.log('Database already initialized. Checking tasks table schema...');
                dbInstance.run(`
                  CREATE TABLE IF NOT EXISTS tasks (
                    id TEXT PRIMARY KEY,
                    title TEXT NOT NULL,
                    description TEXT,
                    due_date TEXT NOT NULL,
                    due_time TEXT,
                    assigned_to TEXT REFERENCES users(id) ON DELETE SET NULL,
                    customer_id TEXT REFERENCES customers(id) ON DELETE SET NULL,
                    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed')),
                    created_by TEXT REFERENCES users(id),
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                  )
                `, (err) => {
                  if (err) {
                    console.error('Failed to create tasks table during validation:', err);
                    return reject(err);
                  }
                  dbInstance.run("CREATE INDEX IF NOT EXISTS idx_tasks_date ON tasks(due_date)", (err) => {
                    if (err) return reject(err);
                    dbInstance.run("CREATE INDEX IF NOT EXISTS idx_tasks_assignee ON tasks(assigned_to)", (err) => {
                      if (err) return reject(err);
                      console.log('✅ Tasks database table verified/created.');
                      resolve();
                    });
                  });
                });
              }
            });
          } catch (migrateErr) {
            reject(migrateErr);
          }
        });
      });
    } else if (DB_TYPE === 'postgres') {
      try {
        // Test query
        await dbInstance.query('SELECT NOW()');
        console.log('✅ Connected to PostgreSQL database successfully.');
      } catch (err) {
        console.error('❌ PostgreSQL connection test failed:', err);
        throw err;
      }
    }
  },

  // Database helper methods wrapping commands
  query: (sql, params = []) => {
    return new Promise((resolve, reject) => {
      if (DB_TYPE === 'sqlite') {
        dbInstance.all(sql, params, (err, rows) => {
          if (err) return reject(err);
          resolve(rows);
        });
      } else {
        const pgSQL = translateQuery(sql);
        dbInstance.query(pgSQL, params)
          .then(res => resolve(res.rows))
          .catch(err => reject(err));
      }
    });
  },

  get: (sql, params = []) => {
    return new Promise((resolve, reject) => {
      if (DB_TYPE === 'sqlite') {
        dbInstance.get(sql, params, (err, row) => {
          if (err) return reject(err);
          resolve(row);
        });
      } else {
        const pgSQL = translateQuery(sql);
        dbInstance.query(pgSQL, params)
          .then(res => resolve(res.rows[0] || null))
          .catch(err => reject(err));
      }
    });
  },

  run: (sql, params = []) => {
    return new Promise((resolve, reject) => {
      if (DB_TYPE === 'sqlite') {
        dbInstance.run(sql, params, function (err) {
          if (err) return reject(err);
          resolve({ id: this.lastID, changes: this.changes });
        });
      } else {
        const pgSQL = translateQuery(sql);
        dbInstance.query(pgSQL, params)
          .then(res => resolve({ id: null, changes: res.rowCount }))
          .catch(err => reject(err));
      }
    });
  }
};

module.exports = dbAdapter;
