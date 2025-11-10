-- ============================================================================
-- Create Admin User Script
-- ============================================================================
-- 
-- PURPOSE:
--   Creates an admin user in the database with approved status.
--   This is useful for initial setup or creating additional admin accounts.
-- 
-- WHAT IT DOES:
--   1. Creates a user record with 'admin' role and 'approved' status
--   2. Creates an account record with password hash for authentication
--   3. Uses Better Auth's credential provider
-- 
-- SECURITY NOTES:
--   - Password is stored as bcrypt hash (never store plain text passwords!)
--   - User is automatically approved (bypasses approval workflow)
--   - Email is marked as verified
-- 
-- INSTRUCTIONS:
--   1. Generate a bcrypt hash for your password using Node.js:
--      node -e "const bcrypt=require('bcryptjs');bcrypt.hash('yourpassword',12).then(h=>console.log(h))"
-- 
--   2. Replace the placeholders in the script below:
--      - email_var: Admin email address
--      - name_var: Admin name
--      - password_hash_var: The bcrypt hash from step 1
--
--   3. Run this script in your Supabase SQL Editor
-- 
-- ALTERNATIVE:
--   You can also create admin users through the application's admin panel
--   once you have at least one admin account.
-- 
-- ============================================================================

DO $$
DECLARE
  user_id_var text;
  account_id_var text;
  email_var text := 'admin@yourdomain.com';           -- CHANGE THIS
  name_var text := 'Admin User';                      -- CHANGE THIS  
  password_hash_var text := 'YOUR_BCRYPT_HASH_HERE'; -- CHANGE THIS (bcrypt hash)
BEGIN
  -- Generate IDs
  user_id_var := gen_random_uuid()::text;
  account_id_var := gen_random_uuid()::text;
  
  -- Create user record
  INSERT INTO "user" (
    id, email, name, email_verified, status, role, created_at, updated_at
  ) VALUES (
    user_id_var, email_var, name_var, true, 'approved', 'admin', NOW(), NOW()
  );
  
  -- Create account record with password hash
  INSERT INTO "account" (
    id, user_id, account_id, provider_id, password, created_at, updated_at
  ) VALUES (
    account_id_var, user_id_var, email_var, 'credential', password_hash_var, NOW(), NOW()
  );
  
  RAISE NOTICE '✅ Admin user created successfully!';
  RAISE NOTICE 'Email: %', email_var;
  RAISE NOTICE 'Name: %', name_var;
END $$;
