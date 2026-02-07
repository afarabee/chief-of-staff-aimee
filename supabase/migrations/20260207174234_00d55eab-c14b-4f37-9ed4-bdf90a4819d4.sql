
ALTER TABLE assets ADD COLUMN IF NOT EXISTS show_on_kanban BOOLEAN DEFAULT false;

ALTER TABLE tasks DROP CONSTRAINT IF EXISTS tasks_status_check;
ALTER TABLE tasks ADD CONSTRAINT tasks_status_check
  CHECK (status IN ('pending', 'completed', 'overdue', 'needs_attention'));
