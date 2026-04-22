ALTER TABLE litera.communities ADD COLUMN visibility VARCHAR(20) DEFAULT 'public';
UPDATE litera.communities SET visibility = 'public' WHERE id = 1;