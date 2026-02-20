
# AI Activity, History, and Dismiss Suggestions

## Overview
Four interconnected features: dismiss individual AI suggestions, log executions to a database table, show per-item AI history in edit forms, and a central AI Activity page.

---

## Part A: Dismiss Suggestions

### Changes

**`src/lib/parseSuggestions.ts`**
- Add `dismissed?: boolean` to the `ParsedSuggestion` interface
- Preserve the `dismissed` field when parsing JSON suggestions

**`src/hooks/useDismissSuggestion.ts`** (new file)
- A custom hook that takes `itemType`, `itemId`, and `suggestionIndex`
- Reads the current `ai_suggestions` JSON from the appropriate table (`cos_tasks`, `cos_ideas`, or `tasks`)
- Sets `dismissed: true` on the suggestion at the given index
- Writes the updated JSON back via a direct Supabase PATCH
- Invalidates the relevant TanStack Query cache
- No Edge Function needed

**`src/components/ai/EnrichWithAI.tsx`**
- Import the `X` icon from lucide-react and the new `useDismissSuggestion` hook
- Filter rendered suggestions: only show those where `dismissed` is not `true`
- Add a dismiss button (X icon, top-right) to each suggestion card with tooltip "Dismiss suggestion"
- Track dismissed indices in local state so the UI updates immediately before the DB write completes
- On "Re-enrich," the entire `ai_suggestions` array is replaced, so dismissed state resets naturally

---

## Part B: AI Executions Table

### Database
The `ai_executions` table already exists with the correct schema (id, item_type, item_id, item_title, suggestion, result, created_at). No migration needed.

### Edge Function Update

**`supabase/functions/execute-suggestion/index.ts`**
- After generating the Gemini result and before returning, INSERT a row into `ai_executions` with `item_type`, `item_id`, `item_title`, `suggestion`, and `result`
- `item_title` is already passed from the frontend in the request body -- just use it in the insert

### Frontend Hook Update

**`src/hooks/useExecuteSuggestion.ts`**
- Add `['ai-executions', variables.item_id]` to the list of query keys invalidated on success (so the history section refreshes)

---

## Part C: Per-Item AI History

### New Hook

**`src/hooks/useAiExecutions.ts`** (new file)
- `useAiExecutions(itemId: string | undefined)` -- a TanStack Query hook
- Query key: `['ai-executions', itemId]`
- Queries `ai_executions` where `item_id` matches, ordered by `created_at` desc
- Enabled only when `itemId` is defined (lazy loading)

### New Component

**`src/components/ai/AiHistorySection.tsx`** (new file)
- Props: `itemId: string`
- Uses `useAiExecutions(itemId)` to fetch past executions
- Renders nothing if no executions exist
- Header: Clock icon + "AI History"
- Each entry:
  - Suggestion text (bold, truncated to 1 line)
  - Relative timestamp (using `date-fns`'s `formatDistanceToNow`)
  - Collapsible result section (collapsed by default) with rendered markdown
  - Copy button for result text
- Uses existing Collapsible, Card, and Button components

### Form Integration

**`src/components/tasks/TaskForm.tsx`**
- Import and render `<AiHistorySection itemId={task.id} />` below the `EnrichWithAI` section (only when editing)

**`src/components/ideas/IdeaForm.tsx`**
- Same: render `<AiHistorySection itemId={idea.id} />` below EnrichWithAI

**`src/components/maintenance/MaintenanceTaskForm.tsx`**
- Same: render `<AiHistorySection itemId={task.id} />` below EnrichWithAI

---

## Part D: Central AI Activity Page

### Sidebar

**`src/components/layout/AppSidebar.tsx`**
- Add a new nav item: `{ title: 'AI Activity', url: '/ai-activity', icon: Sparkles }`
- Place it after "Providers" (last in the current list)

### New Hook

**`src/hooks/useAllAiExecutions.ts`** (new file)
- `useAllAiExecutions(itemTypeFilter?: string)` -- fetches from `ai_executions`
- Query key: `['ai-executions', 'all', itemTypeFilter]`
- Orders by `created_at` desc, limit 50
- Optionally filters by `item_type` if provided

### New Page

**`src/pages/AiActivity.tsx`** (new file)
- Page title: "AI Activity", subtitle: "History of all AI-executed suggestions"
- Filter tabs at top: "All", "Tasks", "Ideas", "Reminders" (using existing Tabs component)
- List of execution entries, each showing:
  - Colored badge for item type (blue for Task, amber for Idea, green for Reminder)
  - Item title (text, not a link)
  - Suggestion text (truncated with tooltip for full text)
  - Result preview (~100 chars) with "Show more" collapsible
  - Relative timestamp
  - Copy button for result
- Empty state with sparkles icon and guidance message
- Uses existing Card, Badge, Tabs, Collapsible, Tooltip, Button components

### Router

**`src/App.tsx`**
- Import `AiActivity` page
- Add route: `<Route path="/ai-activity" element={<AiActivity />} />`

---

## New Files Summary
| File | Purpose |
|------|---------|
| `src/hooks/useDismissSuggestion.ts` | Client-side dismiss mutation |
| `src/hooks/useAiExecutions.ts` | Per-item execution history query |
| `src/hooks/useAllAiExecutions.ts` | All executions query (with filter) |
| `src/components/ai/AiHistorySection.tsx` | Per-item history UI component |
| `src/pages/AiActivity.tsx` | Central AI Activity page |

## Modified Files Summary
| File | Change |
|------|--------|
| `src/lib/parseSuggestions.ts` | Add `dismissed` field to interface |
| `src/components/ai/EnrichWithAI.tsx` | Dismiss button + filter dismissed |
| `supabase/functions/execute-suggestion/index.ts` | INSERT into `ai_executions` |
| `src/hooks/useExecuteSuggestion.ts` | Invalidate ai-executions cache |
| `src/components/tasks/TaskForm.tsx` | Add AiHistorySection |
| `src/components/ideas/IdeaForm.tsx` | Add AiHistorySection |
| `src/components/maintenance/MaintenanceTaskForm.tsx` | Add AiHistorySection |
| `src/components/layout/AppSidebar.tsx` | Add AI Activity nav item |
| `src/App.tsx` | Add /ai-activity route |
