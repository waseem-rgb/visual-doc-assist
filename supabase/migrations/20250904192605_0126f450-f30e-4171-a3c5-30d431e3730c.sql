-- Check if user exists in auth.users and create if needed
-- Since we can't directly insert into auth.users, let's check what we have

-- First, let's see what's in admin_users
SELECT * FROM admin_users WHERE email = 'waseem@5thvital.com';

-- Also check if there are any users in auth that match
-- We'll use a different approach to create the user account