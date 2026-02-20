
# Bug Fix: AI Suggestions Lost During Conversion

## Status of the Two Bugs

### Fix 1: AI suggestions disappear after saving -- ALREADY FIXED
The previous edit already resolved this. Both `taskToDbUpdate` and `ideaToDbUpdate` explicitly exclude `ai_suggestions` from the update payload, so saving a form no longer overwrites the AI suggestions column. No further changes needed.

### Fix 2: Converting between types loses AI suggestions -- NEEDS FIX
The conversion logic in `AppContext.tsx` correctly passes `aiSuggestions` to the create mutation. However, the **insert mapping functions** (`taskToDbInsert` in `useTasks.ts` and `ideaToDbInsert` in `useIdeas.ts`) strip it out -- they never include `ai_suggestions` in the database payload. So the value is silently dropped.

## Changes Required

### 1. `src/hooks/useTasks.ts` -- `taskToDbInsert` function
- Add `ai_suggestions: task.aiSuggestions || null` to the returned insert object
- This ensures that when converting an Idea to a Task, the AI suggestions carry over to the new `cos_tasks` row

### 2. `src/hooks/useIdeas.ts` -- `ideaToDbInsert` function
- Add `ai_suggestions: idea.aiSuggestions || null` to the returned insert object
- This ensures that when converting a Task to an Idea, the AI suggestions carry over to the new `cos_ideas` row

## Why This Fixes Conversion
The flow is: `convertIdeaToTask` calls `createTaskMutation.mutate({ ..., aiSuggestions })` which calls `taskToDbInsert()` to build the Supabase payload. Currently `taskToDbInsert` ignores `aiSuggestions`. After this fix, it will include `ai_suggestions` in the INSERT, and the data will persist in the new row.

## What Won't Change
- The update functions remain unchanged -- they correctly exclude `ai_suggestions` to prevent form saves from wiping them
- The conversion logic in `AppContext.tsx` is already correct
- Maintenance task hooks are unaffected (conversions to/from reminders are not yet implemented)
