const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

// Determine database type based on Environment Variables
// By default, fallback to 'sqlite' for zero-config developer onboarding
const DB_TYPE = process.env.DB_TYPE || 'sqlite'; 
const SQLite_DB_PATH = process.env.SQLITE_DB_PATH || path.join(__dirname, '../../database/msbt.db');

let dbInstance = null;

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
      // PostgreSQL connection setup (production mode)
      console.log('PostgreSQL Selected. Driver dependencies required for production.');
      // Placeholder connection validation - will connect in production environment
      resolve();
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
        // Postgres query implementation
        reject(new Error('PostgreSQL driver not initiated in dev mode'));
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
        reject(new Error('PostgreSQL driver not initiated in dev mode'));
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
        reject(new Error('PostgreSQL driver not initiated in dev mode'));
      }
    });
  }
};

module.exports = dbAdapter;
