-- Migration: Stage 2 - Enable RLS on remaining tables
-- Target: Supabase PostgreSQL Database

-- Enable RLS on remaining tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE seasons ENABLE ROW LEVEL SECURITY;
ALTER TABLE entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- Idempotent Policy creation for service_role on remaining tables
DROP POLICY IF EXISTS "Allow service_role full access on users" ON users;
CREATE POLICY "Allow service_role full access on users" ON users TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow service_role full access on seasons" ON seasons;
CREATE POLICY "Allow service_role full access on seasons" ON seasons TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow service_role full access on entries" ON entries;
CREATE POLICY "Allow service_role full access on entries" ON entries TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow service_role full access on payments" ON payments;
CREATE POLICY "Allow service_role full access on payments" ON payments TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow service_role full access on invoices" ON invoices;
CREATE POLICY "Allow service_role full access on invoices" ON invoices TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow service_role full access on audit_logs" ON audit_logs;
CREATE POLICY "Allow service_role full access on audit_logs" ON audit_logs TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow service_role full access on tasks" ON tasks;
CREATE POLICY "Allow service_role full access on tasks" ON tasks TO service_role USING (true) WITH CHECK (true);
