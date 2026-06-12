-- MSBT Local Dev SQLite Schema

-- 1. Users Table
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('Owner', 'Co-Owner', 'Manager', 'Accountant', 'Employee')),
    full_name TEXT NOT NULL,
    phone TEXT,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'suspended')),
    permissions TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 2. Seasons Table
CREATE TABLE IF NOT EXISTS seasons (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    start_date TEXT NOT NULL,
    end_date TEXT,
    status TEXT DEFAULT 'Active' CHECK (status IN ('Active', 'Closed', 'Archived')),
    created_by TEXT REFERENCES users(id),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 3. Customers Table
CREATE TABLE IF NOT EXISTS customers (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    village TEXT NOT NULL,
    address TEXT,
    notes TEXT,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 4. Entries Table
CREATE TABLE IF NOT EXISTS entries (
    id TEXT PRIMARY KEY,
    customer_id TEXT REFERENCES customers(id) ON DELETE RESTRICT,
    season_id TEXT REFERENCES seasons(id) ON DELETE RESTRICT,
    entry_type TEXT NOT NULL CHECK (entry_type IN ('Trip', 'Hour', 'Trade', 'Minute')),
    rate REAL NOT NULL CHECK (rate >= 0),
    quantity REAL NOT NULL CHECK (quantity > 0),
    total_amount REAL NOT NULL, -- Calculated before inserting in JS for SQLite support
    description TEXT,
    entry_date TEXT NOT NULL,
    created_by TEXT REFERENCES users(id),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 5. Payments Table
CREATE TABLE IF NOT EXISTS payments (
    id TEXT PRIMARY KEY,
    customer_id TEXT REFERENCES customers(id) ON DELETE RESTRICT,
    season_id TEXT REFERENCES seasons(id) ON DELETE RESTRICT,
    amount REAL NOT NULL CHECK (amount > 0),
    payment_mode TEXT NOT NULL CHECK (payment_mode IN ('Cash', 'Bank Transfer', 'UPI', 'Cheque')),
    reference_no TEXT,
    payment_date TEXT NOT NULL,
    notes TEXT,
    created_by TEXT REFERENCES users(id),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 6. Invoices Table
CREATE TABLE IF NOT EXISTS invoices (
    id TEXT PRIMARY KEY,
    invoice_no TEXT UNIQUE NOT NULL,
    customer_id TEXT REFERENCES customers(id),
    season_id TEXT REFERENCES seasons(id),
    billing_date TEXT NOT NULL,
    total_revenue REAL NOT NULL,
    total_paid REAL NOT NULL,
    due_amount REAL NOT NULL,
    metadata TEXT, -- Stores JSON string of entries & payments
    created_by TEXT REFERENCES users(id),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 7. Audit Logging Table
CREATE TABLE IF NOT EXISTS audit_logs (
    id TEXT PRIMARY KEY,
    user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    target_table TEXT,
    target_id TEXT,
    details TEXT,
    ip_address TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 8. Tasks & Reminders Table
CREATE TABLE IF NOT EXISTS tasks (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    due_date TEXT NOT NULL, -- Format: YYYY-MM-DD
    due_time TEXT,          -- Format: HH:MM (Optional)
    assigned_to TEXT REFERENCES users(id) ON DELETE SET NULL,
    customer_id TEXT REFERENCES customers(id) ON DELETE SET NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed')),
    created_by TEXT REFERENCES users(id),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_entries_customer ON entries(customer_id);
CREATE INDEX IF NOT EXISTS idx_entries_season ON entries(season_id);
CREATE INDEX IF NOT EXISTS idx_payments_customer ON payments(customer_id);
CREATE INDEX IF NOT EXISTS idx_payments_season ON payments(season_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_invoices_customer ON invoices(customer_id);
CREATE INDEX IF NOT EXISTS idx_tasks_date ON tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_tasks_assignee ON tasks(assigned_to);
