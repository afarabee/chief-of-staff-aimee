

# Add "Enrich with AI" Feature

## Overview
Add an "Enrich with AI" button to Task, Idea, and Reminder edit forms. When clicked, Gemini analyzes the item and generates specific, actionable suggestions for what an AI assistant could do to help. Suggestions are saved to the existing `ai_suggestions` column on each table.

## What You'll See
- A new "Enrich with AI" button (with sparkle icon) appears in the edit forms for Tasks, Ideas, and Reminders
- Clicking it calls Gemini, which returns a numbered list of 3-5 practical AI suggestions
- The suggestions appear in a styled card below the button
- If suggestions already exist, they show immediately and the button says "Re-enrich with AI"
- Suggestions persist in the database and are visible whenever you reopen the item

## Technical Details

### 1. New Edge Function: `enrich-item`
**File:** `supabase/functions/enrich-item/index.ts`

- Accepts POST with `{ item_type, item }` where `item_type` is `"task"`, `"idea"`, or `"reminder"`
- Builds a focused prompt asking Gemini for 3-5 actionable AI suggestions specific to the item
- Calls Gemini 2.0 Flash API (same pattern as the `chat` function, using `GEMINI_API_KEY` / `VITE_GEMINI_API_KEY`)
- Saves the response text to the appropriate table's `ai_suggestions` column via Supabase service role client
- Returns `{ suggestions: "..." }` or `{ error: "..." }`

### 2. Update `supabase/config.toml`
Add:
```
[functions.enrich-item]
verify_jwt = false
```

### 3. New Reusable Hook: `src/hooks/useEnrichItem.ts`
- Exports a `useEnrichItem()` hook wrapping a TanStack `useMutation`
- Calls `supabase.functions.invoke('enrich-item', { body: { item_type, item } })`
- On success: invalidates the relevant query cache (`tasks`, `ideas`, `maintenance-tasks`)
- On error: shows a toast

### 4. New Reusable Component: `src/components/ai/EnrichWithAI.tsx`
- Props: `itemType`, `item` (the data to send), `existingSuggestions` (string or null), `isLoading` (from mutation)
- Renders the button: "Enrich with AI" (Sparkles icon) or "Re-enrich with AI" (RefreshCw icon) if suggestions exist
- Shows loading state with spinner and "Enriching..." text
- Renders a suggestions card when `ai_suggestions` is present (Sparkles icon header, formatted text, preserving line breaks)

### 5. Integrate into TaskForm (`src/components/tasks/TaskForm.tsx`)
- Only shown when editing an existing task (not creating new)
- Pass task fields: `{ id, title, description, status, priority, due_date }`
- Show suggestions card if `task.ai_suggestions` exists (note: need to add `aiSuggestions` to the Task type)

### 6. Integrate into IdeaForm (`src/components/ideas/IdeaForm.tsx`)
- Only shown when editing an existing idea
- Pass idea fields: `{ id, title, description, status }`

### 7. Integrate into MaintenanceTaskForm (`src/components/maintenance/MaintenanceTaskForm.tsx`)
- Only shown when editing an existing reminder
- Pass reminder fields: `{ id, name, notes, status, next_due_date, recurrence_rule }`

### 8. Update Types
- Add `aiSuggestions: string | null` to `Task` interface in `src/types/index.ts`
- Add `aiSuggestions: string | null` to `Idea` interface in `src/types/index.ts`
- Add `aiSuggestions: string | null` to `MaintenanceTask` interface in `src/types/maintenance.ts`
- Update the DB-to-app mapping functions in `useTasks.ts`, `useIdeas.ts`, and `useMaintenanceTasks.ts` to read `ai_suggestions`

### Files Created
- `supabase/functions/enrich-item/index.ts`
- `src/hooks/useEnrichItem.ts`
- `src/components/ai/EnrichWithAI.tsx`

### Files Modified
- `supabase/config.toml` -- add enrich-item function config
- `src/types/index.ts` -- add `aiSuggestions` to Task and Idea
- `src/types/maintenance.ts` -- add `aiSuggestions` to MaintenanceTask
- `src/hooks/useTasks.ts` -- map `ai_suggestions` field
- `src/hooks/useIdeas.ts` -- map `ai_suggestions` field
- `src/hooks/useMaintenanceTasks.ts` -- map `ai_suggestions` field
- `src/components/tasks/TaskForm.tsx` -- add EnrichWithAI component
- `src/components/ideas/IdeaForm.tsx` -- add EnrichWithAI component
- `src/components/maintenance/MaintenanceTaskForm.tsx` -- add EnrichWithAI component

