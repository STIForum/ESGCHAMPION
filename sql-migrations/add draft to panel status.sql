ALTER TABLE panels ADD COLUMN status text DEFAULT 'draft';
UPDATE panels SET status = 'active' WHERE is_active = true;
UPDATE panels SET status = 'inactive' WHERE is_active = false;
