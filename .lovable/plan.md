

# Clickable Briefing Suggestions with Linked Task/Idea IDs

## Approach

Have the AI model return the specific task and idea IDs referenced by each suggestion. On the frontend, clicking a suggestion navigates to a new filtered view showing only those items. If no IDs are attached, the suggestion is not clickable.

## Changes

### 1. Edge Function: `supabase/functions/daily-briefing/index.ts`

Update the tool schema to include an optional `related_item_ids` array on each suggestion:

```json
{
  "text": "Schedule Charlee's Bordetella booster...",
  "type": "focus",
  "related_item_ids": ["uuid-1", "uuid-2"]
}
```

- The AI already receives task/idea data with IDs in the context string. Update the context to include IDs (currently omitted).
- Add `related_item_ids` to the suggestion schema as an optional array of strings, described as "IDs of the tasks or ideas this suggestion refers to. Only include if the suggestion maps to specific items."

### 2. Types: `src/hooks/useDailyBriefing.ts`

Add `relatedItemIds?: string[]` to the `BriefingSuggestion` interface.

### 3. Frontend: `src/components/command-center/BriefingWidget.tsx`

- When a suggestion has `related_item_ids` with at least one entry, render it as a clickable badge with `cursor-pointer` and a subtle hover effect.
- On click, navigate to `/briefing-items?ids=uuid1,uuid2` (a new route).

### 4. New Page: `src/pages/BriefingItems.tsx`

- Reads `ids` from query params, splits into an array.
- Uses `useApp()` to get all tasks and ideas, filters to only those matching the IDs.
- Renders a simple list view with `TaskCard` and `IdeaCard` components, with click-to-edit support (reusing existing patterns from Dashboard/CategoryDetail).
- Header shows "Briefing Items" with a back button.

### 5. Route: `src/App.tsx`

Add `/briefing-items` route pointing to the new page.

## File Changes

| File | Action |
|------|--------|
| `supabase/functions/daily-briefing/index.ts` | Add IDs to context, add `related_item_ids` to schema |
| `src/hooks/useDailyBriefing.ts` | Add `relatedItemIds` to type |
| `src/components/command-center/BriefingWidget.tsx` | Make badges clickable when IDs present |
| `src/pages/BriefingItems.tsx` | Create new filtered view page |
| `src/App.tsx` | Add route |

