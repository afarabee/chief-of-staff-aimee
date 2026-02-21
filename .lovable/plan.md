

# AI Enrichment Redesign: Move Suggestions to Dedicated Pages

## Overview
Move all AI suggestion interaction out of edit modals into a dedicated enrichment record system. The `ai_enrichments` table stores enrichment sessions, and a new detail page at `/ai-activity/:id` provides full suggestion management (execute, dismiss, create subtask). Edit forms keep only a simple "Enrich with AI" button.

---

## Part A: Remove AI Suggestion UI from Edit Modals

### `src/components/tasks/TaskForm.tsx`
- Remove imports of `EnrichWithAI` and `AiHistorySection`
- Remove the block rendering `<EnrichWithAI>` and `<AiHistorySection>` (lines 335-346)
- Add a simple "Enrich with AI" button (Sparkles icon) that triggers the new enrichment flow (see Part B)
- The button should appear in both create and edit modes

### `src/components/ideas/IdeaForm.tsx`
- Remove imports of `EnrichWithAI` and `AiHistorySection`
- Remove the block rendering them
- Add the same "Enrich with AI" button

### `src/components/maintenance/MaintenanceTaskForm.tsx`
- Same removal and replacement

---

## Part B: New "Enrich with AI" Button Behavior

### New hook: `src/hooks/useEnrichAndSave.ts`
This hook orchestrates the full enrichment flow:

1. **Auto-save the item first:**
   - Accepts current form values + item type + optional existing item ID
   - If new (no ID): calls the appropriate create mutation (`cos_tasks`, `cos_ideas`, or `tasks`) and captures the returned ID
   - If existing: calls the appropriate update mutation silently

2. **Call the `enrich-item` Edge Function** (existing) to get suggestions from Gemini

3. **Insert into `ai_enrichments`** with:
   - `item_type`, `item_id`, `item_title`
   - `suggestions`: JSONB array with `{ suggestion, status: "pending", result: null }` for each

4. **Toast sequence:**
   - Loading toast: "AI is working on it..."
   - Success toast with "View" action button navigating to `/ai-activity`
   - Error toast on failure

5. **Post-success behavior:**
   - If new item: close the modal (call `onClose`)
   - If existing: user stays in the form
   - Invalidate `['ai-enrichments']` cache

### Update `enrich-item` Edge Function
- Stop writing suggestions to the item's `ai_suggestions` column (remove the DB update portion, lines 144-155)
- Just return the generated suggestions array -- the frontend will save to `ai_enrichments` instead

### Each form integration
- Import `useEnrichAndSave` and `useNavigate`
- Add state: `isEnriching`
- Render button:
  ```
  <Button onClick={handleEnrich} disabled={isEnriching || !title.trim()}>
    {isEnriching ? <Loader2 spinning /> : <Sparkles />}
    {isEnriching ? "Enriching..." : "Enrich with AI"}
  </Button>
  ```
- `handleEnrich` calls the hook, passing current form values

---

## Part C: Update the AI Activity List Page

### `src/pages/AiActivity.tsx` -- Full rewrite
- Fetch from `ai_enrichments` instead of `ai_executions`
- Each card shows:
  - Item type badge (Task=blue, Idea=purple, Reminder=orange)
  - Item title
  - Relative timestamp
  - Suggestion summary: "5 suggestions (2 executed, 1 dismissed)"
  - Click navigates to `/ai-activity/:id`
- Filter tabs: "All", "Tasks", "Ideas", "Reminders"
- Empty state preserved

### New hook: `src/hooks/useAiEnrichments.ts`
- `useAiEnrichments(filter?)` -- query key `['ai-enrichments', filter]`
- Fetches from `ai_enrichments`, ordered by `created_at` desc, limit 50
- Optional `item_type` filter

---

## Part D: Enrichment Detail Page

### New page: `src/pages/AiEnrichmentDetail.tsx`
- Route: `/ai-activity/:id`
- Back link: "Back to AI Activity"
- Header: type badge + item title + timestamp
- "View original [task/idea/reminder]" link -- navigates to the item's edit page

**Suggestions list -- each as a card:**
- Full suggestion text
- Status: pending (gray), executed (green check), dismissed (hidden by default, toggle to show)
- **Pending actions:**
  - Execute (Zap): calls `execute-suggestion` Edge Function, updates suggestion status to "executed" and saves result in JSONB
  - Create Subtask (ListPlus): creates `cos_tasks` with `parent_task_id` (if task), shows toast
  - Dismiss (X): sets status to "dismissed" in JSONB
- **Executed display:** result text in styled container + Copy button

### New hook: `src/hooks/useAiEnrichment.ts`
- `useAiEnrichment(id)` -- query key `['ai-enrichment', id]`
- Single row fetch from `ai_enrichments`

### New hook: `src/hooks/useUpdateEnrichmentSuggestion.ts`
- Mutation that reads current `suggestions` JSONB, updates one by index, writes back
- Invalidates `['ai-enrichment', enrichmentId]` and `['ai-enrichments']`

---

## Part E: Router and Navigation Updates

### `src/App.tsx`
- Add route: `<Route path="/ai-activity/:id" element={<AiEnrichmentDetail />} />`
- Keep existing `/ai-activity` route

### Sidebar remains unchanged (already has AI Activity link)

---

## Part F: Clean Up Old Code

### Remove or stop using:
- `src/components/ai/EnrichWithAI.tsx` -- delete entirely (no longer rendered anywhere)
- `src/components/ai/AiHistorySection.tsx` -- delete (history is now on the AI Activity page)
- `src/hooks/useDismissSuggestion.ts` -- delete (dismissal now updates `ai_enrichments` JSONB)
- `src/hooks/useEnrichItem.ts` -- keep but simplify (still calls the Edge Function, but no longer writes to item's `ai_suggestions`)
- `src/hooks/useAiExecutions.ts` -- delete (replaced by enrichments-based views)
- `src/hooks/useAllAiExecutions.ts` -- delete (replaced by `useAiEnrichments`)
- `src/lib/parseSuggestions.ts` -- delete (no longer needed; suggestions are JSONB)

### Keep:
- `enrich-item` Edge Function (generates suggestions)
- `execute-suggestion` Edge Function (executes suggestions + logs to `ai_executions`)
- `ai_executions` table (append-only logging)
- `useExecuteSuggestion` hook (reused in detail page)
- `useCreateSubtask` hook (reused in detail page)

### Stop reading/writing `ai_suggestions` column:
- `useTasks.ts`: remove `aiSuggestions` from `dbTaskToTask` and `taskToDbInsert`
- `useIdeas.ts`: same
- `useMaintenanceTasks.ts`: remove `aiSuggestions` from `mapRow`
- `src/types/index.ts`: remove `aiSuggestions` from `Task` and `Idea` interfaces
- `src/types/maintenance.ts`: remove `aiSuggestions` from `MaintenanceTask` interface
- `src/contexts/AppContext.tsx`: remove `aiSuggestions` from conversion functions

---

## New Files Summary

| File | Purpose |
|------|---------|
| `src/hooks/useEnrichAndSave.ts` | Orchestrates save-then-enrich-then-store flow |
| `src/hooks/useAiEnrichments.ts` | List all enrichments (for activity page) |
| `src/hooks/useAiEnrichment.ts` | Fetch single enrichment (for detail page) |
| `src/hooks/useUpdateEnrichmentSuggestion.ts` | Update a suggestion's status/result in JSONB |
| `src/pages/AiEnrichmentDetail.tsx` | Full enrichment detail page with suggestion actions |

## Modified Files Summary

| File | Change |
|------|--------|
| `src/components/tasks/TaskForm.tsx` | Remove EnrichWithAI/AiHistory, add simple enrich button |
| `src/components/ideas/IdeaForm.tsx` | Same |
| `src/components/maintenance/MaintenanceTaskForm.tsx` | Same |
| `src/pages/AiActivity.tsx` | Rewrite to show `ai_enrichments` records |
| `src/App.tsx` | Add `/ai-activity/:id` route |
| `supabase/functions/enrich-item/index.ts` | Remove DB update to `ai_suggestions` column |
| `src/hooks/useTasks.ts` | Remove `aiSuggestions` mapping |
| `src/hooks/useIdeas.ts` | Remove `aiSuggestions` mapping |
| `src/hooks/useMaintenanceTasks.ts` | Remove `aiSuggestions` mapping |
| `src/types/index.ts` | Remove `aiSuggestions` from interfaces |
| `src/types/maintenance.ts` | Remove `aiSuggestions` from interface |
| `src/contexts/AppContext.tsx` | Remove `aiSuggestions` from conversion |

## Deleted Files

| File | Reason |
|------|--------|
| `src/components/ai/EnrichWithAI.tsx` | Replaced by detail page |
| `src/components/ai/AiHistorySection.tsx` | Replaced by AI Activity page |
| `src/hooks/useDismissSuggestion.ts` | Replaced by `useUpdateEnrichmentSuggestion` |
| `src/hooks/useAiExecutions.ts` | Replaced by `useAiEnrichments` |
| `src/hooks/useAllAiExecutions.ts` | Replaced by `useAiEnrichments` |
| `src/lib/parseSuggestions.ts` | No longer needed (JSONB native) |

