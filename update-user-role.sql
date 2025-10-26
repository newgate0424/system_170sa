-- Update newgatetest user role to ADMIN
UPDATE `admin_auth`.`User` 
SET `role` = 'ADMIN' 
WHERE `username` = 'newgatetest';

-- Verify the change
SELECT `id`, `username`, `role`, `teams` 
FROM `admin_auth`.`User` 
WHERE `username` = 'newgatetest';
