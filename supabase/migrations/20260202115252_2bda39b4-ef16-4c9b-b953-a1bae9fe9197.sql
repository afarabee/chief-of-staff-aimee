-- Add icon column (nullable)
ALTER TABLE cos_categories ADD COLUMN icon text;

-- Migrate existing emoji data: extract first character as icon
-- and update name to be text only
UPDATE cos_categories 
SET 
  icon = LEFT(name, 1),
  name = TRIM(SUBSTRING(name FROM 2));