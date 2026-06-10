-- MSBT Initial Seeds (Works on Postgres & SQLite)

-- 1. Insert Default Users (Password Hash is for 'password123' hashed with bcrypt)
-- Owner: admin / password123
-- Manager: manager / password123
-- Accountant: accountant / password123
-- Employee: employee / password123
INSERT INTO users (id, username, password_hash, role, full_name, phone, status) VALUES 
('u1-owner-id-uuid-1111-2222', 'admin', '$2a$10$YqjVXLWnIuNZcKsVHozGWOhaBUgDCJT8nCX.9NdvAb8pJe.r7crVO', 'Owner', 'Samprat Behera', '+919988776655', 'active'),
('u2-manager-id-uuid-1111-2222', 'manager', '$2a$10$YqjVXLWnIuNZcKsVHozGWOhaBUgDCJT8nCX.9NdvAb8pJe.r7crVO', 'Manager', 'Rakesh Kumar Mohanty', '+918877665544', 'active'),
('u3-acct-id-uuid-1111-2222', 'accountant', '$2a$10$YqjVXLWnIuNZcKsVHozGWOhaBUgDCJT8nCX.9NdvAb8pJe.r7crVO', 'Accountant', 'Priya Ranjan Das', '+917766554433', 'active'),
('u4-emp-id-uuid-1111-2222', 'employee', '$2a$10$YqjVXLWnIuNZcKsVHozGWOhaBUgDCJT8nCX.9NdvAb8pJe.r7crVO', 'Employee', 'Suresh Sahu', '+916655443322', 'active');


