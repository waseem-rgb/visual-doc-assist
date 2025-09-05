-- Fix the admin user ID mismatch
-- Update admin_users table to use the correct auth.users ID for waseem@5thvital.com
UPDATE admin_users 
SET id = '9d2c7a4c-9da0-46c2-bc00-f102d0768e1a'
WHERE email = 'waseem@5thvital.com';