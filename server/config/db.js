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
  const isServerless = !!process.env.VERCEL;
  console.log(`PostgreSQL Selected. Instantiating connection pool (Mode: ${isServerless ? 'Serverless' : 'Server'})...`);
  
  dbInstance = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    max: isServerless ? 2 : 10, // Max 2 clients in serverless to prevent Supabase Pooler overload
    idleTimeoutMillis: isServerless ? 15000 : 30000, // Close idle clients fast in serverless (15s)
    connectionTimeoutMillis: isServerless ? 3000 : 5000, // Timeout fast in serverless (3s)
  });

  // Lifecycle Event Logging
  dbInstance.on('connect', () => {
    console.log('🔌 [DB Pool] New connection client created in pool.');
  });
  
  dbInstance.on('remove', () => {
    console.log('🔌 [DB Pool] Connection client removed/closed.');
  });

  dbInstance.on('error', (err) => {
    console.error('❌ Unexpected database error on idle client:', err.message);
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
                      
                      // Verify SQLite columns in 'users'
                      dbInstance.all("PRAGMA table_info(users)", (err, columnsInfo) => {
                        if (err) return reject(err);
                        const columns = columnsInfo.map(c => c.name.toLowerCase());
                        
                        const verifyCols = [];
                        if (!columns.includes('permissions')) {
                          console.log('⚠️ Column "permissions" missing in SQLite users table. Adding it...');
                          verifyCols.push(new Promise((resCol, rejCol) => {
                            dbInstance.run('ALTER TABLE users ADD COLUMN permissions TEXT;', (colErr) => {
                              if (colErr) rejCol(colErr);
                              else resCol();
                            });
                          }));
                        }
                        if (!columns.includes('profile_photo')) {
                          console.log('⚠️ Column "profile_photo" missing in SQLite users table. Adding it...');
                          verifyCols.push(new Promise((resCol, rejCol) => {
                            dbInstance.run('ALTER TABLE users ADD COLUMN profile_photo TEXT;', (colErr) => {
                              if (colErr) rejCol(colErr);
                              else resCol();
                            });
                          }));
                        }
                        
                        Promise.all(verifyCols)
                          .then(() => {
                            dbInstance.get("SELECT sql FROM sqlite_master WHERE name='entries'", (err, row) => {
                              if (err) return reject(err);
                              if (row && !row.sql.includes('Minute')) {
                                console.log("Migrating SQLite entries table to support 'Minute' entry type...");
                                dbInstance.serialize(() => {
                                  dbInstance.run("PRAGMA foreign_keys=OFF;");
                                  dbInstance.run("BEGIN TRANSACTION;");
                                  dbInstance.run("ALTER TABLE entries RENAME TO entries_old;");
                                  dbInstance.run(`
                                    CREATE TABLE entries (
                                        id TEXT PRIMARY KEY,
                                        customer_id TEXT REFERENCES customers(id) ON DELETE RESTRICT,
                                        season_id TEXT REFERENCES seasons(id) ON DELETE RESTRICT,
                                        entry_type TEXT NOT NULL CHECK (entry_type IN ('Trip', 'Hour', 'Trade', 'Minute')),
                                        rate REAL NOT NULL CHECK (rate >= 0),
                                        quantity REAL NOT NULL CHECK (quantity > 0),
                                        total_amount REAL NOT NULL,
                                        description TEXT,
                                        entry_date TEXT NOT NULL,
                                        created_by TEXT REFERENCES users(id),
                                        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                                    );
                                  `);
                                  dbInstance.run("INSERT INTO entries SELECT * FROM entries_old;");
                                  dbInstance.run("DROP TABLE entries_old;");
                                  dbInstance.run("COMMIT;");
                                  dbInstance.run("PRAGMA foreign_keys=ON;", (fkErr) => {
                                    if (fkErr) reject(fkErr);
                                    else {
                                      console.log("SQLite entries table migration complete.");
                                      resolve();
                                    }
                                  });
                                });
                              } else {
                                resolve();
                              }
                            });
                          })
                          .catch(colErr => reject(colErr));
                      });
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
      const isServerless = !!process.env.VERCEL;
      const maxRetries = isServerless ? 3 : 1; // Retry up to 3 times in serverless
      let attempt = 0;
      let connected = false;

      while (attempt < maxRetries && !connected) {
        attempt++;
        try {
          console.log(`🔌 Attempting database connection (Attempt ${attempt}/${maxRetries})...`);
          console.log(`📊 [DB Pool Stats] Total=${dbInstance.totalCount}, Idle=${dbInstance.idleCount}, Waiting=${dbInstance.waitingCount}`);
          
          await dbInstance.query('SELECT NOW()');
          connected = true;
          console.log('✅ Connected to PostgreSQL database successfully.');
        } catch (err) {
          console.error(`❌ Connection attempt ${attempt} failed: ${err.message}`);
          if (err.message && err.message.includes('timeout')) {
            console.error('⚠️ Timeout detected. This might be due to Supabase connection queue saturation.');
          }
          if (attempt >= maxRetries) {
            throw err;
          }
          const delay = Math.pow(2, attempt) * 1000;
          console.log(`🔄 Retrying in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }

      // Skip heavy DDL audits in serverless environments to minimize cold start latency & connection overhead
      if (isServerless) {
        console.log('⚡ Serverless (Vercel) environment detected. Skipping automatic DDL schema validation to optimize cold starts and minimize database connections.');
        return;
      }

      try {
        // Verify/Create schema tables
        console.log('🔍 Running database schema verification...');
        const requiredTables = ['users', 'seasons', 'customers', 'entries', 'payments', 'invoices', 'audit_logs', 'tasks'];
        const tableCheck = await dbInstance.query(
          "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'"
        );
        const existingTables = tableCheck.rows.map(r => r.table_name.toLowerCase());
        
        let missingTableFound = false;
        for (const table of requiredTables) {
          if (!existingTables.includes(table)) {
            console.warn(`⚠️ Database schema is missing table: "${table}"`);
            missingTableFound = true;
          }
        }
        
        if (missingTableFound) {
          console.log('🏗️ Applying database schema to create missing tables...');
          const schemaPath = path.join(__dirname, '../../database/schema.sql');
          const schemaSQL = fs.readFileSync(schemaPath, 'utf8');
          await dbInstance.query(schemaSQL);
          console.log('✅ Production PostgreSQL Schema verified/applied.');
        } else {
          console.log('✅ All required database tables exist.');
        }

        // Verify required columns in 'users' table (permissions and profile_photo)
        const colCheck = await dbInstance.query(
          "SELECT column_name FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'users'"
        );
        const columns = colCheck.rows.map(r => r.column_name.toLowerCase());
        
        if (!columns.includes('permissions')) {
          console.warn('⚠️ Column "permissions" is missing in users table. Altering table...');
          await dbInstance.query('ALTER TABLE users ADD COLUMN permissions TEXT;');
          console.log('✅ Column "permissions" added to users table.');
        }
        if (!columns.includes('profile_photo')) {
          console.warn('⚠️ Column "profile_photo" is missing in users table. Altering table...');
          await dbInstance.query('ALTER TABLE users ADD COLUMN profile_photo TEXT;');
          console.log('✅ Column "profile_photo" added to users table.');
        }

        // Alter entries check constraint for PostgreSQL
        try {
          console.log('🔄 Checking/updating entries check constraint for "Minute" support...');
          await dbInstance.query('ALTER TABLE entries DROP CONSTRAINT IF EXISTS entries_entry_type_check;');
          await dbInstance.query("ALTER TABLE entries ADD CONSTRAINT entries_entry_type_check CHECK (entry_type IN ('Trip', 'Hour', 'Trade', 'Minute'));");
          console.log('✅ PostgreSQL entries check constraint verified.');
        } catch (constErr) {
          console.warn('⚠️ Could not update entries check constraint (possibly already updated):', constErr.message);
        }
      } catch (err) {
        console.error('❌ PostgreSQL schema verification failed:', err);
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
