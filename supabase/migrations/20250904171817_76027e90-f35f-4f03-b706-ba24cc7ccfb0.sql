-- Assign customer role to the existing user who signed up through customer auth
INSERT INTO user_roles (user_id, role) 
SELECT u.id, 'customer'::app_role 
FROM auth.users u 
WHERE u.email = 'dr_khustar@yahoo.com' 
  AND NOT EXISTS (
    SELECT 1 FROM user_roles ur 
    WHERE ur.user_id = u.id AND ur.role = 'customer'::app_role
  );