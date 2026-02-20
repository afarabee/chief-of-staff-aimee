
# Subtasks: Fix Create Button, Parent-Child Relationships, and UI

## Overview

Six changes: fix the broken Create Subtask button, wire up `parent_task_id`, update types/hooks, show subtasks on parent forms, hide subtasks from Kanban, and show parent links on subtask forms.

---

## Part A: Fix Create Subtask Button

The button currently works at the code level but may silently fail because `useCreateSubtask` references column names that need to match the DB exactly. The hook looks correct, but the Supabase types file doesn't include `parent_task_id` yet -- this will be addressed by regenerating types after we confirm the column exists.

**Debug check**: The `useCreateSubtask` hook inserts with `status: 'Backlog'` and `priority: 'Low'` (capitalized). The DB defaults are `'To-Do'` and `'Medium'` (also capitalized), so this should work. The real issue may be a type mismatch or the mutation not firing. We will add console logging and verify end-to-end.

**`src/hooks/useCreateSubtask.ts`** -- Rewrite to accept parent item info:
- Add `parentItemId: string`, `parentItemType: 'task' | 'idea' | 'reminder'` to params
- Set `parent_task_id` to `parentItemId` only when `parentItemType === 'task'`
- Use default category ID `ecfc9834-8791-4199-9a2b-c4f49db9d` when none provided
- Update description format: `"Subtask of: [title]\n\nFull suggestion: ...\n\nCreated by AI Enrichment"`
- Invalidate `['subtasks', parentItemId]` on success

**`src/components/ai/EnrichWithAI.tsx`** -- Update `handleCreateSubtask` call:
- Pass `parentItemId: item.id` and `parentItemType: itemType` to the mutation

---

## Part B: Update Types and Hooks

**`src/types/index.ts`**
- Add `parentTaskId: string | null` to the `Task` interface

**`src/hooks/useTasks.ts`**
- In `dbTaskToTask`: map `(dbTask as any).parent_task_id || null` to `parentTaskId` (using `as any` since the generated types may not include it yet; it will work at runtime)
- In `taskToDbInsert`: include `parent_task_id: task.parentTaskId || null`
- In `taskToDbUpdate`: do NOT include `parent_task_id` (same exclusion pattern as `ai_suggestions`)

**`src/integrations/supabase/types.ts`** -- Will be auto-regenerated, but we cast where needed in the meantime.

---

## Part C: New `useSubtasks` Hook

**`src/hooks/useSubtasks.ts`** (new file)
- `useSubtasks(parentTaskId: string | undefined)`
- Query key: `['subtasks', parentTaskId]`
- Fetches from `cos_tasks` where `parent_task_id` equals `parentTaskId`
- Only selects `id, title, status` for lightweight display
- Enabled only when `parentTaskId` is defined

---

## Part D: Show Subtasks on Parent Task Form

**`src/components/tasks/TaskForm.tsx`**
- Import `useSubtasks` and render a "Subtasks" section when editing and subtasks exist
- Section header: ListTree icon + "Subtasks"
- Each subtask as a compact row with:
  - Title (clickable -- opens subtask in a nested `ResponsiveFormDialog`)
  - Small colored status badge (backlog=gray, to-do=blue, in-progress=violet, done=green, blocked=orange)
- Place this section between the description and the AI Suggestions section
- When clicking a subtask, fetch the full task data and open a nested edit dialog
- To handle nested editing: add state for `editingSubtask` and render a second `ResponsiveFormDialog` inside TaskForm

---

## Part E: Hide Subtasks from Kanban Board

**`src/hooks/useTasks.ts`** (or `src/contexts/AppContext.tsx`)
- In the `useTasks` query, add `.is('parent_task_id', null)` filter to the Supabase query
- This ensures subtasks never appear as standalone cards on the Kanban board
- They remain accessible only through their parent task's edit form

---

## Part F: Parent Link on Subtask Form

**`src/components/tasks/TaskForm.tsx`**
- When editing a task that has `parentTaskId` set:
  - Fetch the parent task title using a simple query (inline `useQuery` or a small helper)
  - Show a breadcrumb at the top: a muted-text link with arrow: "Subtask of: [Parent Title]"
  - Clicking it calls `onClose()` and then opens the parent task for editing
- To enable "open parent" behavior, add an optional `onOpenTask?: (taskId: string) => void` prop to `TaskForm`
- Wire this prop from `Tasks.tsx` page to allow navigating between parent and child

---

## File Changes Summary

| File | Change |
|------|--------|
| `src/types/index.ts` | Add `parentTaskId` to Task interface |
| `src/hooks/useTasks.ts` | Map `parent_task_id`, add to insert, filter from main query |
| `src/hooks/useCreateSubtask.ts` | Accept parent info, set `parent_task_id`, invalidate subtasks cache |
| `src/hooks/useSubtasks.ts` | New hook for fetching subtasks |
| `src/components/ai/EnrichWithAI.tsx` | Pass parent ID/type to create subtask |
| `src/components/tasks/TaskForm.tsx` | Add subtasks section, parent breadcrumb, nested edit dialog |
| `src/pages/Tasks.tsx` | Pass `onOpenTask` callback to TaskForm |
| `src/contexts/AppContext.tsx` | Update `addTask` type to accept `parentTaskId` |
