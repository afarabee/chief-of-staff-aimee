

# Plan: Maintenance Task System

## Overview
Build a complete maintenance task system connected to the existing `tasks` table, including a standalone Maintenance page, task management on Asset Detail, a rich task form with file attachments, recurring task logic, and Kanban board integration.

## Step 1: Database Migrations

Two SQL migrations:

1. Add `show_on_kanban` column to the `assets` table:
```sql
ALTER TABLE assets ADD COLUMN IF NOT EXISTS show_on_kanban BOOLEAN DEFAULT false;
```

2. Add status check constraint to `tasks`:
```sql
ALTER TABLE tasks DROP CONSTRAINT IF EXISTS tasks_status_check;
ALTER TABLE tasks ADD CONSTRAINT tasks_status_check
  CHECK (status IN ('pending', 'completed', 'overdue', 'needs_attention'));
```

## Step 2: New Files

### `src/types/maintenance.ts`
Define a `MaintenanceTask` interface:
- id, name, assetId, assetName (joined), providerId, providerName (joined), dateCompleted, nextDueDate, cost, notes, attachmentUrl, recurrenceRule, status, createdAt, updatedAt

### `src/hooks/useMaintenanceTasks.ts`
TanStack Query hooks:
- **useMaintenanceTasks()** -- fetches all tasks joined with `assets(id, name)` and `service_providers(id, name)`. Query key: `['maintenance-tasks']`
- **useAssetMaintenanceTasks(assetId)** -- fetches tasks for a specific asset. Query key: `['tasks', 'asset', assetId]`
- **useCreateMaintenanceTask()** -- INSERT mutation. Invalidates `['maintenance-tasks']` and relevant asset query keys
- **useUpdateMaintenanceTask()** -- UPDATE mutation with same invalidation
- **useDeleteMaintenanceTask()** -- DELETE mutation with same invalidation
- **useCompleteMaintenanceTask()** -- custom mutation that:
  1. Updates the task: status='completed', date_completed=today
  2. If recurrence_rule exists, creates a new task with next_due_date calculated using date-fns (addDays, addMonths, addYears)
  3. Shows appropriate toast ("Task completed" or "Task completed -- next occurrence scheduled for [date]")
  4. Invalidates all maintenance query keys
- **useKanbanMaintenanceTasks()** -- fetches non-completed tasks where the linked asset has show_on_kanban=true. Query key: `['kanban-maintenance']`

Recurrence calculation helper function:
```
parseRecurrence("7d")  -> addDays(today, 7)
parseRecurrence("14d") -> addDays(today, 14)
parseRecurrence("30d") -> addDays(today, 30)
parseRecurrence("3m")  -> addMonths(today, 3)
parseRecurrence("6m")  -> addMonths(today, 6)
parseRecurrence("1y")  -> addYears(today, 1)
```

### `src/components/maintenance/MaintenanceTaskCard.tsx`
Card component used in the Maintenance page sections. Props: task, onComplete, onClick. Shows:
- Circle/check button on the left (calls onComplete)
- Task name, asset name subtitle, contextual date info
- Recurrence badge if recurring
- Visually adapts per section (overdue = red date, completed = strikethrough, etc.)

### `src/components/maintenance/MaintenanceTaskForm.tsx`
Sheet-based form for creating/editing maintenance tasks. Fields:
1. Task Name (required)
2. Asset (Select from assets table, optional; locked when `lockedAssetId` prop is set)
3. Service Provider (Select from service_providers table, optional)
4. Due Date (date picker, defaults to today for new tasks)
5. Recurrence (Select: None, 7d, 14d, 30d, 3m, 6m, 1y)
6. Status (Select: Pending, Needs Attention, Completed)
7. Cost (number input with $ prefix)
8. Completed Date (date picker, only visible when status = Completed)
9. Notes (textarea, 3 rows)
10. Attachment (reuses existing `ImageUpload` component from `src/components/ui/image-upload.tsx` -- same Supabase Storage bucket and pattern)

Uses `useAssets()` for the asset dropdown, `useProviders()` for the provider dropdown.

### `src/pages/Maintenance.tsx`
Main page with 4 collapsible sections. Uses `useMaintenanceTasks()` to fetch all tasks, then filters client-side into:
- **Overdue** (red): status='pending' AND next_due_date < today. Sorted most overdue first.
- **Needs Attention** (amber): status='needs_attention'. Sorted by due date ascending.
- **Upcoming** (blue): status='pending' AND next_due_date between today and today+30 days. Sorted by due date ascending. Shows friendly date labels ("Today", "Tomorrow", "Mon, Feb 9").
- **Completed** (green/muted): status='completed', limited to 20. Sorted by date_completed descending.

Each section header is a Collapsible trigger showing the section name, color accent, and count badge. "Add Task" button at top right. Tapping a card opens the edit form in a Sheet. Empty state with ClipboardCheck icon.

## Step 3: Modified Files

### `src/pages/Assets.tsx` (Part D)
In the detail view, replace the "Tasks coming soon" placeholder (lines 171-174) with:
- A `Switch` toggle labeled "Show tasks on Kanban board" that reads/writes `show_on_kanban` on the asset via `useUpdateAsset`
- **Pending Tasks** subsection: queries `useAssetMaintenanceTasks(assetId)`, filters to pending/needs_attention. Each row shows a circle button, task name (with Repeat icon if recurring), and due date (red if overdue, amber dot if needs_attention). "No pending tasks" if empty.
- **Add Task** button that opens `MaintenanceTaskForm` with `lockedAssetId` set
- **Completed Tasks** subsection: collapsible (collapsed by default), shows most recent 10 completed tasks with green checkmark, strikethrough name, and completion date. "No completed tasks" if empty.

The `show_on_kanban` column needs to be added to the `useAssets` hook's select query and the `Asset` type.

### `src/types/assets.ts`
Add `showOnKanban: boolean` field to the `Asset` interface.

### `src/hooks/useAssets.ts`
- Update `mapRow` to include `show_on_kanban` -> `showOnKanban`
- Update `useUpdateAsset` mutation to also accept `show_on_kanban` in its type
- Add `show_on_kanban` to the select query (it comes automatically with `*`)

### `src/pages/Tasks.tsx` (Part E -- Kanban Integration)
- Import `useKanbanMaintenanceTasks()` hook
- Add a "Show maintenance tasks" toggle (Switch) at the top near the filter controls, default on
- When enabled, fetch maintenance tasks and map their statuses to Kanban columns:
  - `pending` -> `to-do`
  - `needs_attention` -> `blocked`
- Merge these into `tasksByStatus` alongside regular `cos_tasks`
- Maintenance tasks rendered with a distinct "Maintenance" badge and asset name subtitle
- They are NOT wrapped in `Draggable` -- they appear in the column but cannot be dragged
- Clicking a maintenance task opens the MaintenanceTaskForm in a Sheet (not the cos_tasks Dialog)

### `src/components/tasks/KanbanColumn.tsx`
- Accept an optional `maintenanceTasks` prop (array of maintenance tasks to render after the draggable cos_tasks)
- Render maintenance task cards without Draggable wrappers
- Each shows a "Maintenance" badge, task name, asset name, and due date

### `src/components/layout/AppSidebar.tsx`
Add nav item: `{ title: 'Maintenance', url: '/maintenance', icon: ClipboardCheck }` after Providers.

### `src/App.tsx`
Add route: `<Route path="/maintenance" element={<Maintenance />} />`

## Technical Details

| Detail | Description |
|--------|-------------|
| Tables | `tasks` (maintenance), `assets` (show_on_kanban), `service_providers` (provider dropdown) |
| Query keys | `['maintenance-tasks']`, `['tasks', 'asset', assetId]`, `['kanban-maintenance']` |
| Invalidation | All three keys invalidated on any maintenance task mutation; `['assets']` on show_on_kanban toggle |
| Attachment uploads | Reuses existing `ImageUpload` component and `attachments` Supabase Storage bucket |
| Date library | date-fns: addDays, addMonths, addYears, format, formatDistanceToNow, isToday, isTomorrow, isPast |
| Recurrence | Parsed client-side from string format ("7d", "3m", "1y") |
| Kanban separation | Maintenance tasks are read-only on the Kanban -- not draggable, visually tagged |
| cos_tasks unchanged | No modifications to the cos_tasks table, useTasks hook, or TaskForm component |

## File Summary

**New files (6):**
- `src/types/maintenance.ts`
- `src/hooks/useMaintenanceTasks.ts`
- `src/components/maintenance/MaintenanceTaskCard.tsx`
- `src/components/maintenance/MaintenanceTaskForm.tsx`
- `src/pages/Maintenance.tsx`

**Modified files (7):**
- `src/types/assets.ts` (add showOnKanban)
- `src/hooks/useAssets.ts` (map show_on_kanban)
- `src/pages/Assets.tsx` (replace tasks placeholder with real task section)
- `src/pages/Tasks.tsx` (add maintenance toggle and merged display)
- `src/components/tasks/KanbanColumn.tsx` (render non-draggable maintenance cards)
- `src/components/layout/AppSidebar.tsx` (add Maintenance nav item)
- `src/App.tsx` (add /maintenance route)

**Database migrations (2):**
- Add `show_on_kanban` column to `assets`
- Add status check constraint to `tasks`

