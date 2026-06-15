-- Migration: Stage 1 - Enable RLS on customers (Canary Test)
-- Target: Supabase PostgreSQL Database

-- Enable RLS on customers
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

-- Idempotent Policy creation for service_role
DROP POLICY IF EXISTS "Allow service_role full access on customers" ON customers;
CREATE POLICY "Allow service_role full access on customers" ON customers TO service_role USING (true) WITH CHECK (true);
